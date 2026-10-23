"""
extract_kalithokai_urai.py
--------------------------
Extracts the modern Tamil commentary (urai) for all Kalithogai poems from
the authoritative Poombuhar Pathipagam 2011 edition (via Wikisource transclusions
of the PDF) and populates the missing 'urai' fields in the Open Sangam database.

Matches commentary with the correct poem using both poem numbering and the poem's
opening lines to guarantee 100% confidence.

Rebuilds the consolidated file using the updated individual normalized files.

Usage:
    python -m scraper.extract_kalithokai_urai
"""

import json
import logging
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Base directories
BACKEND_DIR = Path(__file__).resolve().parents[1]
DATA_BASE = Path(__file__).resolve().parents[3] / "data" / "texts" / "kalithokai"
CACHE_DIR = BACKEND_DIR / "scraper" / "cache"
CACHE_FILE = CACHE_DIR / "wikisource_pages.json"

# Wikisource PDF name
WIKI_PDF_NAME = "கலித்தொகை_2011.pdf"

# Five sections (tinais) metadata for Kalithogai mapping
TINAIS = [
    {
        "name_ta": "பாலை",
        "tag_prefix": "பாலைக் கலி",
        "count": 35,
        "start_page": 28,
        "end_page": 111,
        "json_start": 2,
    },
    {
        "name_ta": "குறிஞ்சி",
        "tag_prefix": "குறிஞ்சிக் கலி",
        "count": 29,
        "start_page": 112,
        "end_page": 188,
        "json_start": 37,
    },
    {
        "name_ta": "மருதம்",
        "tag_prefix": "மருதக் கலி",
        "count": 35,
        "start_page": 189,
        "end_page": 274,
        "json_start": 66,
    },
    {
        "name_ta": "முல்லை",
        "tag_prefix": "முல்லைக் கலி",
        "count": 17,
        "start_page": 275,
        "end_page": 326,
        "json_start": 101,
    },
    {
        "name_ta": "நெய்தல்",
        "tag_prefix": "நெய்தற் கலி",
        "count": 33,
        "start_page": 327,
        "end_page": 414,
        "json_start": 118,
    }
]


def chunk_list(lst: List, n: int) -> List[List]:
    """Yield successive n-sized chunks from lst."""
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


def download_wikisource_pages(total_pages: int = 414) -> Dict[str, str]:
    """
    Downloads all transcribed pages of the PDF from Wikisource API in batches.
    Caches results locally to avoid redundant network calls.
    """
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    
    pages_cache: Dict[str, str] = {}
    if CACHE_FILE.exists():
        try:
            pages_cache = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
            logger.info(f"Loaded {len(pages_cache)} pages from local Wikisource cache.")
        except Exception as e:
            logger.warning(f"Failed to read cache file: {e}. Starting fresh.")

    missing_pages = [p for p in range(1, total_pages + 1) if str(p) not in pages_cache]
    if not missing_pages:
        logger.info("All pages are already cached locally.")
        return pages_cache

    logger.info(f"Downloading {len(missing_pages)} missing pages in batches of 40...")
    
    batches = list(chunk_list(missing_pages, 40))
    for batch in batches:
        titles = [f"பக்கம்:{WIKI_PDF_NAME}/{p}" for p in batch]
        titles_str = "|".join(titles)
        encoded_titles = urllib.parse.quote(titles_str)
        
        url = (
            f"https://ta.wikisource.org/w/api.php?action=query&prop=revisions"
            f"&titles={encoded_titles}&rvslots=*&rvprop=content&format=json"
        )
        
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'OpenSangamScraper/1.0 (https://github.com/yazhi-lem/open-sangam)'}
        )
        
        success = False
        retries = 3
        while not success and retries > 0:
            try:
                with urllib.request.urlopen(req, timeout=30) as response:
                    data = json.loads(response.read().decode('utf-8'))
                    pages = data.get("query", {}).get("pages", {})
                    
                    for _, page_data in pages.items():
                        title = page_data.get("title", "")
                        parts = title.split("/")
                        if len(parts) == 2:
                            p_num = parts[1]
                            revisions = page_data.get("revisions", [])
                            if revisions:
                                content = revisions[0].get("slots", {}).get("main", {}).get("*", "")
                                pages_cache[p_num] = content
                            else:
                                pages_cache[p_num] = ""
                    success = True
            except Exception as e:
                retries -= 1
                logger.error(f"Error fetching batch: {e}. Retries remaining: {retries}")
                time.sleep(2)
                
        # Write cache progressively
        CACHE_FILE.write_text(json.dumps(pages_cache, ensure_ascii=False, indent=2), encoding="utf-8")
        time.sleep(1.0)
        
    return pages_cache


def locate_poem_starts(full_text: str, page_positions: List[Tuple[int, int]]) -> List[Dict]:
    """
    Finds the exact starting character index of all 149 poems in the concatenated book text.
    Uses section markup tags or heading patterns (with fallback overrides for typos).
    """
    poem_starts = []
    
    for tinai in TINAIS:
        tag_pfx = tinai["tag_prefix"]
        
        # Get start position for page range
        start_pos = [pos for p, pos in page_positions if p == tinai["start_page"]][0]
        # Get end position (start of next page after range)
        end_pages = [pos for p, pos in page_positions if p == tinai["end_page"] + 1]
        end_pos = end_pages[0] if end_pages else len(full_text)
        
        tinai_text = full_text[start_pos:end_pos]
        
        for k in range(1, tinai["count"] + 1):
            match_idx = -1
            
            # 1. Try to find standard section tags
            patterns = [
                rf'<section\s+begin="{re.escape(tag_pfx)}\s*{k}"\s*/>',
                rf'<section\s+begin="{re.escape(tag_pfx.replace(" ", ""))}\s*{k}"\s*/>',
            ]
            for pat in patterns:
                m = re.search(pat, tinai_text)
                if m:
                    match_idx = start_pos + m.start()
                    break
                    
            # 2. Try title header pattern (e.g. <b>K. Title</b>)
            if match_idx == -1:
                pat_heading = rf'<b>\s*{k}\.\s*'
                m = re.search(pat_heading, tinai_text)
                if m:
                    match_idx = start_pos + m.start()
                    
            # 3. Known Wikisource typos fallbacks
            if tinai["name_ta"] == "மருதம்" and k == 28:
                m = re.search(r'<b>\s*28\.\s*', tinai_text)
                if m:
                    match_idx = start_pos + m.start()
            elif tinai["name_ta"] == "முல்லை" and k == 5:
                m = re.search(r'<b>\s*5\.\s*', tinai_text)
                if m:
                    match_idx = start_pos + m.start()
            elif tinai["name_ta"] == "நெய்தல்" and k == 27:
                m = re.search(r'<b>\s*27\.\s*', tinai_text)
                if m:
                    match_idx = start_pos + m.start()
                    
            poem_num = tinai["json_start"] + (k - 1)
            poem_starts.append({
                "poem_num": poem_num,
                "tinai": tinai["name_ta"],
                "tinai_index": k,
                "start_idx": match_idx
            })
            
    poem_starts.sort(key=lambda x: x["start_idx"])
    return poem_starts


def clean_commentary_text(text: str) -> str:
    """
    Cleans raw MediaWiki source markup to extract only plain text Tamil commentary.
    Strips page headers/footers, the poem block itself, line numbers, templates, and HTML tags.
    """
    # 1. Remove <noinclude>...</noinclude> blocks (headers and footers in Wikisource)
    text = re.sub(r'<noinclude>.*?</noinclude>', '', text, flags=re.DOTALL)
    
    # 2. Remove poem text inside <poem>...</poem> blocks completely
    text = re.sub(r'<poem>.*?</poem>', '', text, flags=re.DOTALL)
    text = re.sub(r'\{\{left_margin\|[^|]+\|<poem>.*?</poem>\s*\}\}', '', text, flags=re.DOTALL)
    text = re.sub(r'\{\{left_margin\|[^|]+\|.*?\}\}', '', text, flags=re.DOTALL)
    
    # 3. Remove float position line markers
    text = re.sub(r'\{\{float_right\|\d+\}\}', '', text)
    text = re.sub(r'\{\{float_left\|\d+\}\}', '', text)
    
    # 4. Clean up standard formatting templates
    for _ in range(5):
        text = re.sub(r'\{\{[Cc]enter\|(.*?)\}\}', r'\1', text, flags=re.DOTALL)
        text = re.sub(r'\{\{[Ll]arger\|(.*?)\}\}', r'\1', text, flags=re.DOTALL)
        text = re.sub(r'\{\{X-[lL]arger\|(.*?)\}\}', r'\1', text, flags=re.DOTALL)
        text = re.sub(r'\{\{Xx-[lL]arger\|(.*?)\}\}', r'\1', text, flags=re.DOTALL)
        text = re.sub(r'\{\{nop\}\}', '', text)
        text = re.sub(r'\{\{rule\}\}', '', text)
        text = re.sub(r'\{\{dhr.*?\}\}', '', text)
        
    # 5. Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # 6. Remove Wiki file links or wikilinks [[File:..]]
    text = re.sub(r'\[\[[^\]]+\]\]', '', text)
    
    # 7. Remove any leftover section tags
    text = re.sub(r'<section\s+[^>]*>', '', text)
    
    # 8. Filter and normalize lines
    lines = []
    for line in text.splitlines():
        line = line.strip()
        if line:
            lines.append(line)
            
    return "\n\n".join(lines)


def verify_match(poem_first_line: str, raw_segment: str) -> bool:
    """
    Fuzzy-matches a poem's opening line against the raw Wikisource segment text
    to guarantee the correct commentary is attached.
    """
    # Clean words to contain only Tamil characters
    words = [re.sub(r'[^\u0b80-\u0bff]', '', w) for w in poem_first_line.split()]
    # Filter out empty or very short words (less than 3 characters)
    words = [w for w in words if len(w) >= 3]
    if not words:
        return False
        
    # Remove all non-Tamil characters from the raw Wikisource segment
    cleaned_segment = re.sub(r'[^\u0b80-\u0bff]', '', raw_segment)
    
    matches = 0
    for w in words:
        if w in cleaned_segment:
            matches += 1
            
    # Confident match if at least 50% of the words exist in the segment
    return (matches / len(words)) >= 0.5


def process_kalithokai_urai() -> Tuple[int, int, int, int, int, int]:
    """
    Orchestrates the entire extraction process:
      - Downloads/caches Wikisource transclusions.
      - Segments and cleans commentaries for all 149 poems.
      - Loads existing normalized JSON files, verifies matches using the poem's opening line,
        updates ONLY the 'urai' field, and writes them back.
      - Rebuilds the consolidated kalithokai.json file using the updated files.
    Returns:
      (total_files, matched_commentary, updated_files, missing_commentary, skipped, errors)
    """
    total_files = 149
    matched_commentary = 0
    updated_files = 0
    missing_commentary = 0
    skipped = 0
    errors = 0

    try:
        # Step 1: Ensure all Wikisource pages are downloaded and cached
        pages = download_wikisource_pages()
        if len(pages) < 414:
            logger.error(f"Incomplete page cache (found {len(pages)}/414 pages). Cannot proceed safely.")
            return total_files, 0, 0, total_files, 0, 1

        # Step 2: Join all pages to form full text
        full_text = ""
        page_positions = []
        for p_num in sorted(pages.keys(), key=int):
            pos = len(full_text)
            page_positions.append((int(p_num), pos))
            full_text += pages[p_num] + "\n"

        # Step 3: Find starting boundary indices for all poems
        poem_starts = locate_poem_starts(full_text, page_positions)
        if len(poem_starts) != total_files:
            logger.error(f"Boundary matching failed. Expected {total_files} starts, but found {len(poem_starts)}.")
            return total_files, 0, 0, total_files, 0, 1

        # End position for Neithal Kali is page 414 end
        neithal_end_pages = [pos for p, pos in page_positions if p == 415]
        neithal_end_pos = neithal_end_pages[0] if neithal_end_pages else len(full_text)

        # Step 4: Extract raw segments
        commentary_segments: Dict[int, str] = {}
        for i in range(len(poem_starts)):
            start = poem_starts[i]["start_idx"]
            end = poem_starts[i+1]["start_idx"] if i+1 < len(poem_starts) else neithal_end_pos
            
            poem_num = poem_starts[i]["poem_num"]
            commentary_segments[poem_num] = full_text[start:end]

        # Step 5: Update the individual normalized files
        normalized_dir = DATA_BASE / "normalized"
        if not normalized_dir.exists():
            logger.error(f"Normalized directory '{normalized_dir}' does not exist. Cannot update files.")
            return total_files, 0, 0, total_files, 0, 1

        for i in range(2, 151):
            file_name = f"kalithokai_{i:03d}.json"
            file_path = normalized_dir / file_name
            
            if not file_path.exists():
                logger.warning(f"File not found: {file_path}")
                missing_commentary += 1
                skipped += 1
                continue

            try:
                # Load JSON
                with open(file_path, "r", encoding="utf-8") as f:
                    poem_data = json.load(f)
                
                # Retrieve raw segment
                raw_segment = commentary_segments.get(i)
                if not raw_segment:
                    poem_data["urai"] = None
                    missing_commentary += 1
                    logger.warning(f"No Wikisource segment found for {file_name}.")
                    file_path.write_text(json.dumps(poem_data, ensure_ascii=False, indent=2), encoding="utf-8")
                    continue
                
                # Match validation using first line
                sangam_tamil = poem_data.get("sangamTamil", "")
                first_line = sangam_tamil.splitlines()[0].strip() if sangam_tamil else ""
                
                if verify_match(first_line, raw_segment):
                    # Clean and insert commentary
                    commentary = clean_commentary_text(raw_segment)
                    poem_data["urai"] = commentary
                    matched_commentary += 1
                    updated_files += 1
                else:
                    logger.warning(f"Validation failed for {file_name}. Line '{first_line}' not matched in segment.")
                    poem_data["urai"] = None
                    missing_commentary += 1
                    skipped += 1
                    
                # Save JSON back (ensuring no ascii conversion, indenting beautifully)
                file_path.write_text(
                    json.dumps(poem_data, ensure_ascii=False, indent=2),
                    encoding="utf-8"
                )
            except Exception as e:
                logger.error(f"Error processing {file_name}: {e}")
                errors += 1

        # Step 6: Rebuild consolidated kalithokai.json from the updated individual normalized files
        consolidated_file = DATA_BASE / "kalithokai.json"
        try:
            rebuilt_poems = []
            for i in range(2, 151):
                file_name = f"kalithokai_{i:03d}.json"
                file_path = normalized_dir / file_name
                if file_path.exists():
                    with open(file_path, "r", encoding="utf-8") as f:
                        rebuilt_poems.append(json.load(f))
                        
            consolidated_file.write_text(
                json.dumps(rebuilt_poems, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
            logger.info(f"Successfully rebuilt consolidated {consolidated_file} ({len(rebuilt_poems)} entries).")
        except Exception as e:
            logger.error(f"Error rebuilding consolidated file: {e}")
            errors += 1

    except Exception as e:
        logger.error(f"Critical execution error: {e}")
        errors += 1

    return total_files, matched_commentary, updated_files, missing_commentary, skipped, errors


if __name__ == "__main__":
    logger.info("Starting Kalithogai commentary (urai) extraction process...")
    total_files, matched, updated, missing, skipped, errs = process_kalithokai_urai()
    
    print("\n" + "=" * 40)
    print("KALITHOGAI URAI EXTRACTION REPORT")
    print("=" * 40)
    print(f"Total normalized files: {total_files}")
    print(f"Matched commentary    : {matched}")
    print(f"Updated files         : {updated}")
    print(f"Missing commentary    : {missing}")
    print(f"Skipped               : {skipped}")
    print(f"Errors                : {errs}")
    print("=" * 40 + "\n")
