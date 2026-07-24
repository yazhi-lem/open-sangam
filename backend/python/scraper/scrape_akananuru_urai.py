"""
scrape_akananuru_urai.py
-------------------------
Scrapes modern Tamil commentary (urai) for all Akananuru poems from learnsangamtamil.com
and updates the normalized JSON records under data/texts/akananooru/normalized/
along with the consolidated JSON and datapackage.json.
"""

import json
import logging
import re
import sys
import urllib.request
from pathlib import Path
from bs4 import BeautifulSoup

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Paths
SCRAPER_DIR = Path(__file__).resolve().parent
CACHE_DIR = SCRAPER_DIR / "cache"
DATA_BASE = SCRAPER_DIR.parents[2] / "data" / "texts" / "akananooru"
NORMALIZED_DIR = DATA_BASE / "normalized"
CONSOLIDATED_FILE = DATA_BASE / "akananooru.json"
DATAPACKAGE_FILE = DATA_BASE / "datapackage.json"

# Learn Sangam Tamil Akananuru pages URL mapping
URLS = {
    "1-120": "https://learnsangamtamil.com/%e0%ae%a4%e0%ae%ae%e0%ae%bf%e0%ae%b4%e0%af%8d-%e0%ae%89%e0%ae%b0%e0%af%88-%e0%ae%85%e0%ae%95%e0%ae%a8%e0%ae%be%e0%ae%a9%e0%af%82%e0%ae%b1%e0%af%81-2/",
    "121-300": "https://learnsangamtamil.com/%e0%ae%a4%e0%ae%ae%e0%ae%bf%e0%ae%b4%e0%af%8d-%e0%ae%89%e0%ae%b0%e0%af%88-%e0%ae%85%e0%ae%95%e0%ae%a8%e0%ae%be%e0%ae%a9%e0%af%82%e0%ae%b1%e0%af%81-121-300/",
    "301-400": "https://learnsangamtamil.com/%e0%ae%a4%e0%ae%ae%e0%ae%bf%e0%ae%b4%e0%af%8d-%e0%ae%89%e0%ae%b0%e0%af%88-%e0%ae%85%e0%ae%95%e0%ae%a8%e0%ae%be%e0%ae%a9%e0%af%82%e0%ae%b1%e0%af%81-301-400/"
}

HEADERS = {
    'User-Agent': 'OpenSangamScraper/1.0 (https://github.com/yazhi-lem/open-sangam)'
}


def fetch_page_with_cache(name: str, url: str) -> str:
    """Fetch the page from network if not cached, otherwise load from cache."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = CACHE_DIR / f"learnsangamtamil_akananuru_{name}.html"
    
    if cache_path.exists():
        logger.info(f"Loaded {name} from local cache: {cache_path}")
        return cache_path.read_text(encoding="utf-8")
    
    logger.info(f"Fetching {name} from network: {url}")
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            html = response.read().decode("utf-8")
            cache_path.write_text(html, encoding="utf-8")
            return html
    except Exception as e:
        logger.error(f"Failed to fetch {url}: {e}")
        raise


def extract_commentaries() -> dict[int, str]:
    """Parse cached HTML pages and segment into a dictionary of {poem_number: urai}."""
    all_commentaries = {}
    
    for name, url in URLS.items():
        html = fetch_page_with_cache(name, url)
        soup = BeautifulSoup(html, "html.parser")
        
        entry = soup.find(class_="entry") or soup.find(id="content")
        if not entry:
            logger.error(f"Could not find main content section in page {name}")
            continue
        
        paras = entry.find_all("p")
        poems_data = {}
        current_num = None
        current_section = []
        
        for p in paras:
            text = p.get_text().strip()
            if not text:
                continue
            
            # Match poem headers: e.g. "அகநானூறு 1" or "அகநானூறு1"
            m = re.match(r"^அகநானூறு\s*(\d+)", text)
            if m:
                if current_num is not None:
                    poems_data[current_num] = current_section
                current_num = int(m.group(1))
                current_section = []
            
            if current_num is not None:
                current_section.append(text)
                
        if current_num is not None:
            poems_data[current_num] = current_section
            
        logger.info(f"Page {name}: Segmented {len(poems_data)} poems.")
        
        for num, sec in poems_data.items():
            urai_paras = []
            started = False
            for p_text in sec:
                p_text_clean = p_text.strip()
                if p_text_clean.startswith("பொருளுரை:"):
                    started = True
                    content = p_text_clean[len("பொருளுரை:"):].strip()
                    if content:
                        urai_paras.append(content)
                elif started:
                    # Urai paragraphs end when reaching notes, glossary, or next poem header
                    if (p_text_clean.startswith("குறிப்பு:") or 
                            p_text_clean.startswith("சொற்பொருள்:") or 
                            re.match(r"^அகநானூறு\s*\d+", p_text_clean)):
                        break
                    urai_paras.append(p_text_clean)
            
            urai_text = "\n\n".join(urai_paras).strip()
            if urai_text:
                all_commentaries[num] = urai_text
            else:
                logger.warning(f"Empty urai extracted for Poem {num}")
                
    return all_commentaries


def main():
    logger.info("Starting Akananuru urai extraction and data population...")
    
    # Step 1: Extract commentaries
    commentaries = extract_commentaries()
    logger.info(f"Successfully extracted {len(commentaries)} commentaries from Learn Sangam Tamil.")
    
    if len(commentaries) < 400:
        logger.error(f"Expected 400 commentaries, but only got {len(commentaries)}. Aborting updates.")
        sys.exit(1)
        
    # Step 2: Update individual normalized JSON files
    if not NORMALIZED_DIR.exists():
        logger.error(f"Normalized directory does not exist: {NORMALIZED_DIR}")
        sys.exit(1)
        
    updated_count = 0
    missing_count = 0
    
    for path in sorted(NORMALIZED_DIR.glob("akananooru_*.json")):
        # Get poem number from filename (e.g. akananooru_001.json -> 1)
        match = re.search(r"akananooru_(\d+)\.json$", path.name)
        if not match:
            logger.warning(f"Unrecognized filename: {path.name}")
            continue
            
        poem_num = int(match.group(1))
        
        with open(path, "r", encoding="utf-8") as f:
            poem_data = json.load(f)
            
        commentary = commentaries.get(poem_num)
        if commentary:
            poem_data["urai"] = commentary
            updated_count += 1
        else:
            poem_data["urai"] = None
            missing_count += 1
            logger.warning(f"No commentary available for Poem {poem_num} ({path.name})")
            
        # Write updated data back
        path.write_text(json.dumps(poem_data, ensure_ascii=False, indent=2), encoding="utf-8")
        
    logger.info(f"Updated {updated_count} individual files. Missing/failed: {missing_count}")
    
    # Step 3: Rebuild consolidated JSON file
    logger.info(f"Rebuilding consolidated file: {CONSOLIDATED_FILE}")
    consolidated_data = []
    for path in sorted(NORMALIZED_DIR.glob("akananooru_*.json")):
        with open(path, "r", encoding="utf-8") as f:
            consolidated_data.append(json.load(f))
            
    CONSOLIDATED_FILE.write_text(
        json.dumps(consolidated_data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    logger.info(f"Consolidated file written with {len(consolidated_data)} entries.")
    
    # Step 4: Update datapackage.json stats
    if DATAPACKAGE_FILE.exists():
        logger.info(f"Updating stats in {DATAPACKAGE_FILE}")
        with open(DATAPACKAGE_FILE, "r", encoding="utf-8") as f:
            dp_data = json.load(f)
            
        if "stats" in dp_data:
            dp_data["stats"]["withUrai"] = updated_count
            DATAPACKAGE_FILE.write_text(
                json.dumps(dp_data, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
            logger.info("Successfully updated datapackage.json stats.")
        else:
            logger.warning("Could not find 'stats' section in datapackage.json.")
            
    logger.info("All tasks completed successfully.")


if __name__ == "__main__":
    main()
