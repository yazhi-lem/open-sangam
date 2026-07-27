import json
import re
import sys
from pathlib import Path

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

SCRAPER_DIR = Path(__file__).resolve().parent
TXT_PATH = SCRAPER_DIR / "cache" / "pathitrupathu.txt"
DATA_DIR = SCRAPER_DIR.parents[2] / "data" / "texts" / "pathitrupathu" / "normalized"

content = TXT_PATH.read_text(encoding="utf-8")

# Parse pages
pages = re.split(r'===== PAGE \d+ =====', content)

# Unique poem headers positions
poem_positions = {}
for num in range(11, 91):
    pattern = rf"(?:^|\n){num}\.\s+.*?(?:\n|$)"
    match = re.search(pattern, content)
    if match:
        poem_positions[num] = match.start()

# Decad positions
decad_headers = [
    "இரண்டாம் பத்து", "மூன்றாம் பத்து", "நான்காம் பத்து", "ஐந்தாம் பத்து",
    "ஆறாம் பத்து", "ஏழாம் பத்து", "எட்டாம் பத்து", "ஒன்பதாம் பத்து", "பதிகம்"
]
decad_positions = []
for dh in decad_headers:
    for match in re.finditer(rf"(?:^|\n).*?{dh}.*?(?:\n|$)", content):
        decad_positions.append(match.start())

def get_poem_block(num):
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

def clean_tamil_word(word):
    return re.sub(r'[^\u0b80-\u0bff]', '', word)

def verify_mapping():
    # Print the table header exactly as requested
    print("| JSON record number | Extracted poem heading | Match (Yes/No) | Commentary found (Yes/No) | Poet found (Yes/No) | Notes |")
    print("|---|---|---|---|---|---|")
    
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

    overall_safe = True
    
    for num in range(11, 91):
        json_path = DATA_DIR / f"pathitrupathu_{num:02d}.json"
        if not json_path.exists():
            print(f"| {num} | File not found | No | No | No | JSON file missing |")
            overall_safe = False
            continue
            
        with open(json_path, "r", encoding="utf-8") as f:
            poem_data = json.load(f)
            
        sangam_tamil = poem_data.get("sangamTamil", "")
        json_words = set(clean_tamil_word(w) for w in sangam_tamil.split() if len(clean_tamil_word(w)) > 2)
        
        block_text = get_poem_block(num)
        
        # Heading
        heading = ""
        for line in block_text.splitlines():
            line = line.strip()
            if line.startswith(f"{num}."):
                heading = line
                break
        
        # Word matching
        block_words = set(clean_tamil_word(w) for w in block_text.split() if len(clean_tamil_word(w)) > 2)
        overlap = json_words.intersection(block_words)
        
        # Match rate
        match_rate = len(overlap) / len(json_words) if json_words else 0
        match_yes_no = "Yes" if match_rate > 0.25 else "No"
        if match_rate <= 0.25:
            overall_safe = False
            
        # Commentary (Urai)
        commentary_keywords = ["விளக்கம்", "பொருளுரை", "தெளிவுரை", "உரை"]
        has_urai = any(kw in block_text for kw in commentary_keywords)
        urai_yes_no = "Yes" if has_urai else "No"
        if not has_urai:
            overall_safe = False
            
        # Poet
        decad = (num - 1) // 10 + 1
        poet = DECAD_POETS.get(decad, "Unknown")
        poet_found = "Yes" if poet != "Unknown" else "No"
        
        notes = f"Overlap: {len(overlap)} words ({match_rate:.0%})"
        if num == 90:
            notes += ". Final poem of Ninth Pathu."
            
        print(f"| {num} | {heading} | {match_yes_no} | {urai_yes_no} | {poet_found} | {notes} |")
        
    print("\nConclusion: " + ("SAFE TO IMPLEMENT" if overall_safe else "MANUAL REVIEW REQUIRED"))

if __name__ == "__main__":
    verify_mapping()
