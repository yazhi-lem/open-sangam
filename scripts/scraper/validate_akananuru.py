"""
validate_akananuru.py
---------------------
Validation script to check the validity, format, and contents of the updated
Akananuru dataset including individual normalized files, the consolidated JSON,
and the Frictionless Data Package descriptor.
"""

import json
import logging
import re
import sys
from pathlib import Path

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Paths
SCRAPER_DIR = Path(__file__).resolve().parent
DATA_BASE = SCRAPER_DIR.parents[2] / "data" / "texts" / "akananooru"
NORMALIZED_DIR = DATA_BASE / "normalized"
CONSOLIDATED_FILE = DATA_BASE / "akananooru.json"
DATAPACKAGE_FILE = DATA_BASE / "datapackage.json"


def validate_normalized_files() -> int:
    """Validate all individual normalized JSON files."""
    if not NORMALIZED_DIR.exists():
        logger.error(f"Normalized directory does not exist: {NORMALIZED_DIR}")
        return 0

    json_files = sorted(NORMALIZED_DIR.glob("akananooru_*.json"))
    expected_count = 220
    
    if len(json_files) != expected_count:
        logger.error(f"Expected {expected_count} normalized files, but found {len(json_files)}")
        return 0
        
    valid_count = 0
    for path in json_files:
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            # Verify basic fields
            if "id" not in data or "poem" not in data or "sangamTamil" not in data:
                logger.error(f"Missing mandatory fields in {path.name}")
                continue
                
            # Verify Urai field
            urai = data.get("urai")
            if urai is None:
                logger.error(f"Urai is null in {path.name}")
                continue
                
            if not isinstance(urai, str):
                logger.error(f"Urai field is not a string in {path.name} (type: {type(urai)})")
                continue
                
            if not urai.strip():
                logger.error(f"Urai field is empty or whitespace-only in {path.name}")
                continue
                
            # Verify Tamil Unicode preservation (presence of Tamil characters)
            tamil_chars = re.findall(r"[\u0b80-\u0bff]", urai)
            if not tamil_chars:
                logger.error(f"No Tamil Unicode characters found in Urai for {path.name}")
                continue
                
            # Ensure no JSON placeholders or raw BeautifulSoup tag formatting
            if "<" in urai or ">" in urai:
                logger.warning(f"Urai field in {path.name} might contain unstripped HTML tags: {urai[:50]}...")
                
            valid_count += 1
        except json.JSONDecodeError as e:
            logger.error(f"JSON corruption detected in {path.name}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error validating {path.name}: {e}")
            
    logger.info(f"Validated individual normalized files: {valid_count} / {len(json_files)} passed.")
    return valid_count


def validate_consolidated_json(expected_records: int) -> bool:
    """Validate the consolidated akananooru.json file."""
    if not CONSOLIDATED_FILE.exists():
        logger.error(f"Consolidated file does not exist: {CONSOLIDATED_FILE}")
        return False
        
    try:
        with open(CONSOLIDATED_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        if not isinstance(data, list):
            logger.error(f"Consolidated JSON must be a list, found: {type(data)}")
            return False
            
        if len(data) != expected_records:
            logger.error(f"Consolidated JSON has {len(data)} entries, expected {expected_records}")
            return False
            
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                logger.error(f"Consolidated list item at index {i} is not a dictionary.")
                return False
                
            if "urai" not in item or not item["urai"]:
                logger.error(f"Consolidated item at index {i} has empty or missing Urai: ID {item.get('id')}")
                return False
                
        logger.info("Consolidated JSON validated successfully.")
        return True
    except json.JSONDecodeError as e:
        logger.error(f"JSON corruption in consolidated file: {e}")
        return False
    except Exception as e:
        logger.error(f"Error validating consolidated file: {e}")
        return False


def validate_datapackage(expected_records: int) -> bool:
    """Validate datapackage.json fields and stats."""
    if not DATAPACKAGE_FILE.exists():
        logger.error(f"datapackage.json does not exist: {DATAPACKAGE_FILE}")
        return False
        
    try:
        with open(DATAPACKAGE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        stats = data.get("stats")
        if not stats:
            logger.error("Missing 'stats' section in datapackage.json")
            return False
            
        records = stats.get("records")
        with_urai = stats.get("withUrai")
        
        if records != expected_records:
            logger.error(f"datapackage.json stats.records is {records}, expected {expected_records}")
            return False
            
        if with_urai != expected_records:
            logger.error(f"datapackage.json stats.withUrai is {with_urai}, expected {expected_records}")
            return False
            
        logger.info("datapackage.json stats validated successfully.")
        return True
    except json.JSONDecodeError as e:
        logger.error(f"JSON corruption in datapackage.json: {e}")
        return False
    except Exception as e:
        logger.error(f"Error validating datapackage.json: {e}")
        return False


def main():
    logger.info("Starting validation of Akananuru dataset...")
    
    valid_normalized = validate_normalized_files()
    if valid_normalized != 220:
        logger.error("Validation failed for individual normalized files.")
        sys.exit(1)
        
    valid_consolidated = validate_consolidated_json(220)
    if not valid_consolidated:
        logger.error("Validation failed for consolidated JSON.")
        sys.exit(1)
        
    valid_datapackage = validate_datapackage(220)
    if not valid_datapackage:
        logger.error("Validation failed for datapackage.json.")
        sys.exit(1)
        
    logger.info("=" * 50)
    logger.info("ALL VALIDATION CHECKS PASSED SUCCESSFULLY!")
    logger.info("=" * 50)


if __name__ == "__main__":
    main()
