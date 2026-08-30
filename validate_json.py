import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent
VOCABULARY_FILE = PROJECT_ROOT / "data" / "vocabulary_base.json"
MANDATORY_FIELDS = [
    "word",
    "grammar",
    "word_formation",
    "definition",
    "synonyms",
    "ielts_level",
    "category",
    "status",
]


def extract_words_list(base_data):
    if isinstance(base_data, list):
        return base_data

    if isinstance(base_data, dict) and isinstance(base_data.get("data"), list):
        return base_data["data"]

    raise ValueError(
        'Invalid JSON root: expected a list [...] or an object with a "data" list.'
    )


def validate_vocabulary():
    if not VOCABULARY_FILE.exists():
        print(f"ERROR: File not found: {VOCABULARY_FILE}")
        return

    try:
        with VOCABULARY_FILE.open("r", encoding="utf-8") as file:
            base_data = json.load(file)

        print("OK: JSON syntax is valid.")

        words_list = extract_words_list(base_data)
        print(f"INFO: Total vocabulary cards found: {len(words_list)}")

        errors_found = 0
        seen_words = set()

        for index, item in enumerate(words_list, start=1):
            if not isinstance(item, dict):
                print(f"ERROR: Item #{index} must be a JSON object.")
                errors_found += 1
                continue

            word = item.get("word", "")
            normalized_word = word.strip().lower() if isinstance(word, str) else ""
            display_word = word if word else "unknown"

            if normalized_word:
                if normalized_word in seen_words:
                    print(f"WARNING: Duplicate word '{word}' at item #{index}.")
                    errors_found += 1
                seen_words.add(normalized_word)

            for field in MANDATORY_FIELDS:
                if field not in item:
                    print(
                        f"WARNING: Item #{index} ('{display_word}') is missing field "
                        f"'{field}'."
                    )
                    errors_found += 1
                    continue

                if isinstance(item[field], str) and not item[field].strip():
                    print(
                        f"WARNING: Item #{index} ('{display_word}') has an empty "
                        f"'{field}' field."
                    )
                    errors_found += 1

            if "synonyms" in item:
                if not isinstance(item["synonyms"], list):
                    print(
                        f"WARNING: Item #{index} ('{display_word}') field 'synonyms' "
                        "must be a list."
                    )
                    errors_found += 1
                elif not all(isinstance(synonym, str) for synonym in item["synonyms"]):
                    print(
                        f"WARNING: Item #{index} ('{display_word}') field 'synonyms' "
                        "must contain only strings."
                    )
                    errors_found += 1

        print("\n--- Validation summary ---")
        if errors_found == 0:
            print(
                f"OK: All {len(words_list)} vocabulary cards are valid, unique, "
                "and ready for Supabase migration."
            )
        else:
            print(f"ERROR: Found {errors_found} issue(s). Fix them before migration.")

    except json.JSONDecodeError as error:
        print("ERROR: Invalid JSON syntax.")
        print(f"Line {error.lineno}, position {error.pos}: {error.msg}")
    except Exception as error:
        print(f"ERROR: Unexpected validation problem: {error}")


if __name__ == "__main__":
    validate_vocabulary()
