import os
import sys
import re
import json
import time
import urllib.request
import urllib.parse
from pathlib import Path
import requests

# Base directories
BACKEND_DIR = Path(__file__).resolve().parents[1]
CACHE_DIR = BACKEND_DIR / "scraper" / "cache"
PDF_PATH = CACHE_DIR / "018.pathitru_pathu.pdf"
OUTPUT_PATH = CACHE_DIR / "pathitrupathu.txt"

def clean_wikisource_text(text: str) -> str:
    if not text:
        return ""
    
    # 1. Remove <noinclude>...</noinclude> blocks (headers and footers in Wikisource)
    text = re.sub(r'<noinclude>.*?</noinclude>', '', text, flags=re.DOTALL)
    
    # 2. Remove standard formatting templates
    text = re.sub(r'\{\{nop\}\}', '', text)
    text = re.sub(r'\{\{rule\}\}', '', text)
    text = re.sub(r'\{\{dhr.*?\}\}', '', text)
    text = re.sub(r'\{\{நாட்டுடைமைப்பொதுக்களம்\}\}', '', text)
    
    # Clean up standard formatting templates (e.g. center, larger)
    for _ in range(3):
        text = re.sub(r'\{\{[Cc]enter\|(.*?)\}\}', r'\1', text, flags=re.DOTALL)
        text = re.sub(r'\{\{[Ll]arger\|(.*?)\}\}', r'\1', text, flags=re.DOTALL)
        text = re.sub(r'\{\{X-[lL]arger\|(.*?)\}\}', r'\1', text, flags=re.DOTALL)
        text = re.sub(r'\{\{float_right\|(.*?)\}\}', r'\1', text, flags=re.DOTALL)
        text = re.sub(r'\{\{left_margin\|.*?\|(.*?)\}\}', r'\1', text, flags=re.DOTALL)
        
    # 3. Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # 4. Remove Wiki file links or wikilinks [[File:..]]
    text = re.sub(r'\[\[[^\]]+\]\]', '', text)
    
    # 5. Remove remaining template calls
    text = re.sub(r'\{\{[^\|\}]+\|(.*?)\}\}', r'\1', text)
    text = re.sub(r'\{\{.*?\}\}', '', text)
    
    # 6. Filter and normalize lines
    lines = []
    for line in text.splitlines():
        line = line.strip()
        line = line.replace('\ufeff', '').replace('\u200b', '')
        if line:
            lines.append(line)
            
    return "\n".join(lines)

def extract_pdf():
    pages_text = {}
    
    # Try pdfplumber
    try:
        import pdfplumber
        print("Attempting to extract text with pdfplumber...")
        with pdfplumber.open(PDF_PATH) as pdf:
            total_pages = len(pdf.pages)
            print(f"Total pages: {total_pages}")
            
            for i, page in enumerate(pdf.pages):
                page_num = i + 1
                text = page.extract_text()
                if text:
                    pages_text[page_num] = text.strip()
                else:
                    pages_text[page_num] = ""
    except Exception as e:
        print(f"pdfplumber failed: {e}")
        pages_text = {}

    has_text = any(text for text in pages_text.values())
    
    # Fallback to PyMuPDF if pdfplumber extracted nothing or failed
    if not has_text:
        print("pdfplumber extracted no text. Trying PyMuPDF (fitz)...")
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(PDF_PATH)
            total_pages = len(doc)
            print(f"Total pages: {total_pages}")
            for i in range(total_pages):
                page_num = i + 1
                page = doc.load_page(i)
                text = page.get_text()
                if text:
                    pages_text[page_num] = text.strip()
                else:
                    pages_text[page_num] = ""
        except Exception as e:
            print(f"PyMuPDF failed: {e}")
            
    # Check if there is text after PyMuPDF too
    has_text = any(text for text in pages_text.values())
    
    if not has_text:
        print("\nBoth pdfplumber and PyMuPDF failed to extract text (Scanned PDF).")
        print("Falling back to downloading digitized proofread text from Tamil Wikisource API...\n")
        
        total_pages = 342
        pages_to_fetch = list(range(1, total_pages + 1))
        
        # Batch fetch from Wikisource
        wiki_pdf = "பதிற்றுப்பத்து.pdf"
        pages_text = {p: "" for p in pages_to_fetch}
        
        # Query 10 pages at a time using POST request to avoid URI limits
        batch_size = 10
        url = "https://ta.wikisource.org/w/api.php"
        headers = {
            'User-Agent': 'OpenSangamScraper/1.0 (https://github.com/yazhi-lem/open-sangam; preeb@example.com)'
        }
        
        for i in range(0, len(pages_to_fetch), batch_size):
            batch = pages_to_fetch[i : i + batch_size]
            print(f"Fetching batch: pages {batch[0]} to {batch[-1]}...")
            
            titles = [f"பக்கம்:{wiki_pdf}/{p}" for p in batch]
            titles_str = "|".join(titles)
            
            data_payload = {
                'action': 'query',
                'prop': 'revisions',
                'titles': titles_str,
                'rvslots': '*',
                'rvprop': 'content',
                'format': 'json'
            }
            
            success = False
            retries = 3
            while not success and retries > 0:
                try:
                    response = requests.post(url, data=data_payload, headers=headers, timeout=30)
                    response.raise_for_status()
                    data = response.json()
                    pages = data.get("query", {}).get("pages", {})
                    
                    for pid, pdata in pages.items():
                        title_ret = pdata.get("title", "")
                        revisions = pdata.get("revisions", [])
                        content = ""
                        if revisions:
                            content = revisions[0].get("slots", {}).get("main", {}).get("*", "")
                        
                        m = re.search(r'/(\d+)$', title_ret)
                        if m:
                            p_num = int(m.group(1))
                            cleaned_content = clean_wikisource_text(content)
                            pages_text[p_num] = cleaned_content
                    success = True
                except Exception as e:
                    retries -= 1
                    print(f"Error fetching batch (start page {batch[0]}): {e}. Retries remaining: {retries}")
                    time.sleep(2)
            
            # Sleep 1.0 second between requests to avoid rate limits
            time.sleep(1.0)
            
    # Save the output
    print(f"Saving extracted content to {OUTPUT_PATH}...")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        for page_num in sorted(pages_text.keys()):
            f.write(f"===== PAGE {page_num} =====\n")
            text = pages_text[page_num]
            if text and text.strip():
                f.write(text.strip() + "\n")
            else:
                f.write("[NO TEXT FOUND]\n")
            f.write("\n")
            
    print(f"Output saved to {OUTPUT_PATH}")
    
    # Report basic analysis
    total_extracted_pages = len(pages_text)
    non_empty_pages = sum(1 for text in pages_text.values() if text and text.strip())
    
    # Check if there are Tamil Unicode characters in any of the extracted text
    has_tamil_unicode = False
    all_extracted_text = "".join(pages_text.values())
    tamil_chars = re.findall(r'[\u0b80-\u0bff]', all_extracted_text)
    if len(tamil_chars) > 100:
        has_tamil_unicode = True
        
    print("\n--- RESULTS ---")
    print(f"Total Pages Extracted: {total_extracted_pages}")
    print(f"Pages with Text: {non_empty_pages}")
    print(f"Contains Tamil Unicode: {has_tamil_unicode} (Count of Tamil characters: {len(tamil_chars)})")
    if not has_text:
        print("OCR required: Yes (No selectable text found in the PDF, successfully fell back to Wikisource transcription)")
    else:
        print("OCR required: No (Selectable text layer exists in the PDF)")

if __name__ == "__main__":
    extract_pdf()
