"""
scrape_paripadal_urai.py
-------------------------
Parses the local cache paripaadal.txt, extracts the modern Tamil commentary (urai)
and poet name for all 23 Paripadal poems, and updates the normalized JSON records under
data/texts/paripadal/normalized/, along with the consolidated paripadal.json and datapackage.json.
"""

import json
import logging
import re
import sys
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Paths
SCRAPER_DIR = Path(__file__).resolve().parent
CACHE_FILE = SCRAPER_DIR / "cache" / "paripaadal.txt"
DATA_BASE = SCRAPER_DIR.parents[2] / "data" / "texts" / "paripadal"
NORMALIZED_DIR = DATA_BASE / "normalized"
CONSOLIDATED_FILE = DATA_BASE / "paripadal.json"
DATAPACKAGE_FILE = DATA_BASE / "datapackage.json"

# Mapped start and end pages in paripaadal.txt (1-indexed)
START_PAGES = [16, 24, 32, 44, 52, 61, 75, 83, 95, 107, 119, 133, 143, 149, 152, 159, 165, 171, 178, 189, 204, 213, 218]
END_PAGES = START_PAGES[1:] + [251]

# Ordinals for matching poem titles
ORDINALS = [
    "முதற்", "இரண்டாம்", "மூன்றாம்", "நான்காம்", "ஐந்தாம்", "ஆறாம்", "ஏழாம்", 
    "எட்டாம்", "ஒன்பதாம்", "பத்தாம்", "பதினொன்றாம்", "பன்னிரண்டாம்", "பதின்மூன்றாம்", 
    "பதினான்காம்", "பதினைந்தாம்", "பதினாறாம்", "பதினேழாம்", "பதினெட்டாம்", 
    "பத்தொன்பதாம்", "இருபதாம்", "இருபத்தொன்றாம்", "இருபத்திரண்டாம்"
]

def normalize_text(text: str) -> str:
    """Normalize text for robust comparison of Tamil verse lines."""
    if not text:
        return ""
    # Strip spaces, punctuation, line breaks, parentheses, etc.
    return re.sub(r'[\s,\.!\?;:\-–#\(\)\[\]"\']+', '', text)

def clean_poet_name(name: str) -> str:
    """Clean the extracted poet name by removing composer/pan metadata."""
    if not name:
        return "ஆசிரியர் அறியப்படவில்லை."
    # Strip keywords relating to music composition or ragas
    for keyword in ["பண்", "இசை", "பகுத்தவர்", "வகுத்தவர்"]:
        if keyword in name:
            name = name.split(keyword)[0]
    name = re.sub(r'[\s,:;\-–#]+', ' ', name).strip()
    if not name or name == "இன்னதென்பது தெளிவாகவில்லை" or name == "தெளிவாகவில்லை":
        return "ஆசிரியர் அறியப்படவில்லை."
    return name

def clean_block(lines_list: list[str]) -> str:
    """Clean and join lines into a single prose paragraph."""
    joined = " ".join(lines_list)
    joined = re.sub(r'\s+', ' ', joined).strip()
    joined = re.sub(r'^[\s\-–\.\*]+', '', joined)
    joined = re.sub(r'[\s\-–\.\*]+$', '', joined)
    return joined

def extract_poem_commentary(num: int, pages: list[str], json_lines_norm: list[str]) -> tuple[str, str]:
    """
    Extracts the modern paraphrase, vocabulary, and explanation for a given poem
    from its respective pages in paripaadal.txt.
    """
    p_start = START_PAGES[num - 1]
    p_end = END_PAGES[num - 1]
    
    # Collect all lines belonging to this poem's pages
    block_lines = []
    for p_num in range(p_start, p_end):
        if p_num < len(pages):
            p_lines = pages[p_num].strip().splitlines()
            for line in p_lines:
                block_lines.append(line.strip())
                
    paraphrase_lines = []
    vocab_lines = []
    explanation_lines = []
    poet = None
    
    mode = 'PARAPHRASE'
    started = False
    
    for line in block_lines:
        if not line:
            continue
            
        # Skip book running headers/footers
        if line == "பரிபாடல் மூலமும் உரையும்" or line == "புலியூர்க்கேசிகன்":
            continue
        if re.match(r'^\d+\s*[-–]?\s*பரிபாடல்', line):
            continue
        if re.match(r'^புலியூர்க்கேசிகன்', line):
            continue
        if re.match(r'^[-–\s\.\*]+$', line):
            continue
            
        # Detect the starting title line to prevent previous poem leakage
        is_header = False
        if num == 1 and ("முதற் பாடல்" in line or "முதலாவது பாடல்" in line):
            is_header = True
        elif num == 23 and ("பரிபாடற்பகுதிகள்" in line or "பரிபாடற் பகுதிகள்" in line):
            is_header = True
        elif 1 < num < 23:
            ord_map = {
                2: ["இரண்டாம்", "இரண்டாங்"],
                3: ["மூன்றாம்", "மூன்றாங்"],
                4: ["நான்காம்", "நான்காங்"],
                5: ["ஐந்தாம்", "ஐந்தாங்", "ஐந்தர்ம்", "தாம் பாடல்"],
                6: ["ஆறாம்", "ஆறாங்"],
                7: ["ஏழாம்", "ஏழாங்"],
                8: ["எட்டாம்", "எட்டாங்"],
                9: ["ஒன்பதாம்", "ஒன்பதாங்"],
                10: ["பத்தாம்", "பத்தாங்", "பதாம்", "பத்தொன்பதாம்"],
                11: ["பதினொன்றாம்", "பதினோராம்", "பதினோராங்", "ர் பாடல்"],
                12: ["பன்னிரண்டாம்", "பன்னிரண்டாங்"],
                13: ["பதின்மூன்றாம்", "பதின்மூன்றாங்"],
                14: ["பதினான்காம்", "பதினான்காங்"],
                15: ["பதினைந்தாம்", "பதினைந்தாங்"],
                16: ["பதினாறாம்", "பதினாறாங்", "பதினாறாம்"],
                17: ["பதினேழாம்", "பதினேழாங்"],
                18: ["பதினெட்டாம்", "பதினெட்டாங்"],
                19: ["பத்தொன்பதாம்", "பத்தொன்பதாங்"],
                20: ["இருபதாம்", "இருபதாங்"],
                21: ["இருபத்தொன்றாம்", "இருபத்தொன்றாங்"],
                22: ["இருபத்திரண்டாம்", "இருபத்திரண்டாங்"]
            }
            allowed = ord_map.get(num, [])
            for word in allowed:
                if "பாடல்" in word:
                    word_base = word.replace("பாடல்", "").strip()
                    if word_base in line and ("பாடல்" in line or "பர்டல்" in line or "பாட்" in line):
                        is_header = True
                        break
                elif word in line:
                    is_header = True
                    break
                
        if is_header:
            started = True
            
        if not started:
            continue
            
        # Extract poet name
        if "பாடியவர் :" in line or "பாடியவர்:" in line:
            m = re.search(r'பாடியவர்\s*:\s*([^;\n]+)', line)
            if m:
                poet = clean_poet_name(m.group(1))
                
        # Handle mode switching
        if "சொற்பொருள் :" in line or "சொற்பொருள்:" in line:
            mode = 'VOCAB'
            idx = line.find("சொற்பொருள்:")
            if idx == -1:
                idx = line.find("சொற்பொருள் :")
                content = line[idx + len("சொற்பொருள் :"):].strip()
            else:
                content = line[idx + len("சொற்பொருள்:"):].strip()
            if content:
                vocab_lines.append(content)
            continue
            
        if "விளக்கம் :" in line or "விளக்கம்:" in line:
            mode = 'EXPLANATION'
            idx = line.find("விளக்கம்:")
            if idx == -1:
                idx = line.find("விளக்கம் :")
                content = line[idx + len("விளக்கம் :"):].strip()
            else:
                content = line[idx + len("விளக்கம்:"):].strip()
            if content:
                explanation_lines.append(content)
            continue
            
        # If the line is an original Tamil verse line, do not include it in the modern prose urai
        line_norm = normalize_text(line)
        is_verse = False
        for jl_norm in json_lines_norm:
            if jl_norm and jl_norm in line_norm:
                is_verse = True
                break
                
        if is_verse:
            continue
            
        # Remove typographic dot/dash layouts
        line = re.sub(r'\.\s*\.\s*\.\s*\.', '', line)
        line = re.sub(r'-\s*-\s*-\s*-', '', line)
        line = line.strip()
        if not line:
            continue
            
        # Collect content in correct category
        if mode == 'PARAPHRASE':
            # Skip metadata lines
            if "பண்வகுத்தவர்" in line or "பண் வகுத்தவர்" in line or "பண் :" in line or "பண்வகுத்தோர்" in line:
                continue
            paraphrase_lines.append(line)
        elif mode == 'VOCAB':
            vocab_lines.append(line)
        elif mode == 'EXPLANATION':
            explanation_lines.append(line)
            
    # Clean up sections
    para_text = clean_block(paraphrase_lines)
    vocab_text = clean_block(vocab_lines)
    expl_text = clean_block(explanation_lines)
    
    # Structure the modern prose urai
    sections = []
    if para_text:
        sections.append(para_text)
    if vocab_text:
        sections.append(f"சொற்பொருள்:\n{vocab_text}")
    if expl_text:
        sections.append(f"விளக்கம்:\n{expl_text}")
        
    final_urai = "\n\n".join(sections).strip()
    
    # Final fallbacks for poet
    if num == 1 or not poet:
        poet = "ஆசிரியர் அறியப்படவில்லை."
        
    return final_urai, poet

def main():
    logger.info("Starting Paripaadal urai extraction and data population...")
    
    if not CACHE_FILE.exists():
        logger.error(f"Cache file {CACHE_FILE} does not exist. Run extract_paripaadal_pdf.py first.")
        sys.exit(1)
        
    if not NORMALIZED_DIR.exists():
        logger.error(f"Normalized directory does not exist: {NORMALIZED_DIR}")
        sys.exit(1)
        
    content = CACHE_FILE.read_text(encoding="utf-8")
    pages = re.split(r'===== PAGE \d+ =====', content)
    # pages[0] is empty, pages[1] is page 1, etc.
    
    updated_count = 0
    
    # Process each of the 23 poems
    for num in range(1, 24):
        json_filename = f"paripadal_{num:02d}.json"
        json_path = NORMALIZED_DIR / json_filename
        
        if not json_path.exists():
            logger.error(f"Expected file {json_filename} not found.")
            continue
            
        with open(json_path, "r", encoding="utf-8") as f:
            poem_data = json.load(f)
            
        # Parse original verse lines from JSON
        sangam_tamil = poem_data.get("sangamTamil", "")
        json_lines = [l.strip() for l in sangam_tamil.splitlines() if l.strip()]
        json_lines_norm = [normalize_text(jl) for jl in json_lines]
        
        # Extract urai and poet
        urai, poet = extract_poem_commentary(num, pages, json_lines_norm)
        
        if urai:
            poem_data["urai"] = urai
            poem_data["poet"] = poet
            updated_count += 1
            logger.info(f"Poem {num:02d}: Extracted commentary successfully. Poet: {poet}")
        else:
            poem_data["urai"] = None
            poem_data["poet"] = poet
            logger.warning(f"Poem {num:02d}: No commentary extracted.")
            
        # Save updated normalized file
        json_path.write_text(json.dumps(poem_data, ensure_ascii=False, indent=2), encoding="utf-8")
        
    logger.info(f"Successfully updated {updated_count}/23 individual normalized JSON files.")
    
    # Rebuild consolidated paripadal.json
    logger.info(f"Rebuilding consolidated file: {CONSOLIDATED_FILE}")
    consolidated_data = []
    for num in range(1, 24):
        json_filename = f"paripadal_{num:02d}.json"
        json_path = NORMALIZED_DIR / json_filename
        with open(json_path, "r", encoding="utf-8") as f:
            consolidated_data.append(json.load(f))
            
    CONSOLIDATED_FILE.write_text(
        json.dumps(consolidated_data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    logger.info(f"Consolidated file written with {len(consolidated_data)} entries.")
    
    # Update datapackage.json stats
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
