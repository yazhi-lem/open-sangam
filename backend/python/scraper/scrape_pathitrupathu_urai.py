"""
scrape_pathitrupathu_urai.py
-------------------------
Parses the local cache pathitrupathu.txt, extracts the modern Tamil commentary (urai)
and poet name for all 80 Pathitrupathu poems (11 to 90), and updates the normalized JSON records under
data/texts/pathitrupathu/normalized/, along with the consolidated pathitrupathu.json and datapackage.json.
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
CACHE_FILE = SCRAPER_DIR / "cache" / "pathitrupathu.txt"
DATA_BASE = SCRAPER_DIR.parents[2] / "data" / "texts" / "pathitrupathu"
NORMALIZED_DIR = DATA_BASE / "normalized"
CONSOLIDATED_FILE = DATA_BASE / "pathitrupathu.json"
DATAPACKAGE_FILE = DATA_BASE / "datapackage.json"

# Decad poets
DECAD_POETS = {
    2: "குமட்டூர்க் கண்ணனார்",
    3: "பாலைக் கௌதமனார்",
    4: "காப்பியாற்றுக் காப்பியனார்",
    5: "பரணர்",
    6: "காக்கை பாடினியார் நச்செள்ளையார்",
    7: "கபிலர்",
    8: "அரிசில் கிழார்",
    9: "பெருங்குன்றூர் கிழார்"
}

def get_decad(num: int) -> int:
    return (num - 1) // 10 + 1

def normalize_text(text: str) -> str:
    """Normalize text for robust comparison of Tamil verse lines."""
    if not text:
        return ""
    # Strip line numbers, spaces, punctuation
    text = re.sub(r'\d+\s*$', '', text)
    return re.sub(r'[\s,\.!\?;:\-–#\(\)\[\]"\']+', '', text)

def clean_block(lines_list: list[str]) -> str:
    """Clean and join lines into a single prose paragraph."""
    joined = " ".join(lines_list)
    joined = re.sub(r'\s+', ' ', joined).strip()
    joined = re.sub(r'^[\s\-–\.\*]+', '', joined)
    joined = re.sub(r'[\s\-–\.\*]+$', '', joined)
    return joined

def main():
    logger.info("Starting Pathitrupathu urai extraction and data population...")
    
    if not CACHE_FILE.exists():
        logger.error(f"Cache file {CACHE_FILE} does not exist. Run extract_pathitrupathu_pdf.py first.")
        sys.exit(1)
        
    if not NORMALIZED_DIR.exists():
        logger.error(f"Normalized directory does not exist: {NORMALIZED_DIR}")
        sys.exit(1)
        
    content = CACHE_FILE.read_text(encoding="utf-8")
    
    # Parse poem starting positions
    poem_positions = {}
    for num in range(11, 91):
        pattern = rf"(?:^|\n){num}\.\s+.*?(?:\n|$)"
        match = re.search(pattern, content)
        if match:
            poem_positions[num] = match.start()
        else:
            logger.warning(f"Could not find header for Poem {num}")
            
    # Parse decad transitions
    decad_headers = [
        "இரண்டாம் பத்து", "மூன்றாம் பத்து", "நான்காம் பத்து", "ஐந்தாம் பத்து",
        "ஆறாம் பத்து", "ஏழாம் பத்து", "எட்டாம் பத்து", "ஒன்பதாம் பத்து", "பதிகம்"
    ]
    decad_positions = []
    for dh in decad_headers:
        for match in re.finditer(rf"(?:^|\n).*?{dh}.*?(?:\n|$)", content):
            decad_positions.append(match.start())
            
    def get_poem_block(num: int) -> str:
        start_pos = poem_positions.get(num)
        if start_pos is None:
            return ""
        possible_ends = []
        next_poem_pos = poem_positions.get(num + 1)
        if next_poem_pos is not None:
            possible_ends.append(next_poem_pos)
        for dp in decad_positions:
            if dp > start_pos:
                possible_ends.append(dp)
        end_pos = min(possible_ends) if possible_ends else len(content)
        return content[start_pos:end_pos].strip()

    updated_count = 0
    
    for num in range(11, 91):
        json_filename = f"pathitrupathu_{num:02d}.json"
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
        
        # Get block text for this poem
        block_text = get_poem_block(num)
        block_lines = block_text.splitlines()
        
        paraphrase_lines = []
        vocab_lines = []
        explanation_lines = []
        
        mode = 'PARAPHRASE'
        started = False
        
        for line in block_lines:
            line = line.strip()
            if not line:
                continue
                
            # Skip page markers
            if line.startswith("===== PAGE") and line.endswith("====="):
                continue
                
            # Skip book running headers/footers
            if "பதிற்றுப்பத்து மூலமும் உரையும்" in line or "புலியூர்க்கேசிகன்" in line:
                continue
            if re.match(r'^\d+\s*[-–]?\s*பதிற்றுப்பத்து', line):
                continue
            if re.match(r'^[-–\s\.\*]+$', line):
                continue
                
            # Skip metadata lines
            # Check for metadata line prefixes
            if any(line.startswith(k) or k in line[:15] for k in ["துறை ", "துறை:", "வண்ணம்:", "வண்ணம்;", "தூக்கு:", "சொல்லியது:", "இதனாற் சொல்லியது:", "இதனாற்சொல்லியது:"]):
                continue
                
            # Detect starting title line
            if line.startswith(f"{num}."):
                started = True
                continue
                
            if not started:
                continue
                
            # Handle mode switching
            # Check for தெளிவுரை keyword
            if "தெளிவுரை:" in line or "தெளிவுரை :" in line:
                mode = 'PARAPHRASE'
                idx = line.find("தெளிவுரை:")
                if idx == -1:
                    idx = line.find("தெளிவுரை :")
                    content_line = line[idx + len("தெளிவுரை :"):].strip()
                else:
                    content_line = line[idx + len("தெளிவுரை:"):].strip()
                if content_line:
                    paraphrase_lines.append(content_line)
                continue
                
            # Check for சொற்பொருள் keyword
            if any(k in line for k in ["சொற்பொருள்:", "சொற்பொருள் :", "சொற்பொருள் விளக்கம்:"]):
                mode = 'VOCAB'
                # Find index of match
                idx = -1
                for k in ["சொற்பொருள் விளக்கம்:", "சொற்பொருள்:", "சொற்பொருள் :"]:
                    idx = line.find(k)
                    if idx != -1:
                        content_line = line[idx + len(k):].strip()
                        break
                if content_line:
                    vocab_lines.append(content_line)
                continue
                
            # Check for விளக்கம் keyword
            if any(k in line for k in ["விளக்கம்:", "விளக்கம் :", "சொற்பொருளும் விளக்கமும்:", "சொற்பொருளும் விளக்கமும் :"]):
                mode = 'EXPLANATION'
                idx = -1
                for k in ["சொற்பொருளும் விளக்கமும்:", "சொற்பொருளும் விளக்கமும் :", "விளக்கம்:", "விளக்கம் :"]:
                    idx = line.find(k)
                    if idx != -1:
                        content_line = line[idx + len(k):].strip()
                        break
                if content_line:
                    explanation_lines.append(content_line)
                continue
                
            # If the line is an original Tamil verse line, do not include it in modern prose
            line_norm = normalize_text(line)
            is_verse = False
            for jl_norm in json_lines_norm:
                if jl_norm and (jl_norm in line_norm or line_norm in jl_norm):
                    is_verse = True
                    break
            if is_verse:
                continue
                
            # Clean typographic dots/dashes
            line = re.sub(r'\.\s*\.\s*\.\s*\.', '', line)
            line = re.sub(r'-\s*-\s*-\s*-', '', line)
            line = line.strip()
            if not line:
                continue
                
            # Collect content based on mode
            if mode == 'PARAPHRASE':
                paraphrase_lines.append(line)
            elif mode == 'VOCAB':
                vocab_lines.append(line)
            elif mode == 'EXPLANATION':
                explanation_lines.append(line)
                
        # Clean the sections
        para_text = clean_block(paraphrase_lines)
        vocab_text = clean_block(vocab_lines)
        expl_text = clean_block(explanation_lines)
        
        # Structure modern prose urai
        sections = []
        if para_text:
            sections.append(para_text)
        if vocab_text:
            sections.append(f"சொற்பொருள்:\n{vocab_text}")
        if expl_text:
            sections.append(f"விளக்கம்:\n{expl_text}")
            
        final_urai = "\n\n".join(sections).strip()
        
        # Poet mapping
        decad = get_decad(num)
        poet = DECAD_POETS.get(decad, "Unknown")
        
        if final_urai:
            poem_data["urai"] = final_urai
            poem_data["poet"] = poet
            updated_count += 1
            logger.info(f"Poem {num:02d}: Extracted commentary successfully. Poet: {poet}")
        else:
            poem_data["urai"] = None
            poem_data["poet"] = poet
            logger.warning(f"Poem {num:02d}: No commentary extracted.")
            
        # Save updated normalized file
        json_path.write_text(json.dumps(poem_data, ensure_ascii=False, indent=2), encoding="utf-8")
        
    logger.info(f"Successfully updated {updated_count}/80 individual normalized JSON files.")
    
    # Rebuild consolidated pathitrupathu.json
    logger.info(f"Rebuilding consolidated file: {CONSOLIDATED_FILE}")
    consolidated_data = []
    for num in range(11, 91):
        json_filename = f"pathitrupathu_{num:02d}.json"
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
