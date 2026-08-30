import json
import os
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv
from supabase import create_client


PROJECT_ROOT = Path(__file__).resolve().parent
VOCABULARY_FILE = PROJECT_ROOT / "data" / "vocabulary_base.json"
TABLE_NAME = "vocabulary"
BATCH_SIZE = 500
TABLE_FIELDS = [
    "word",
    "grammar",
    "word_formation",
    "definition",
    "synonyms",
    "ielts_level",
    "category",
    "status",
]


def normalize_supabase_url(raw_url):
    url = raw_url.strip().strip('"').strip("'").rstrip("/")
    parsed_url = urlparse(url)

    if not parsed_url.scheme or not parsed_url.netloc:
        raise ValueError("SUPABASE_URL must be a valid URL, for example https://project-id.supabase.co")

    return f"{parsed_url.scheme}://{parsed_url.netloc}"


def load_words(file_path):
    with file_path.open("r", encoding="utf-8") as file:
        raw_data = json.load(file)

    if isinstance(raw_data, list):
        words_list = raw_data
    elif isinstance(raw_data, dict) and isinstance(raw_data.get("data"), list):
        words_list = raw_data["data"]
    else:
        raise ValueError(
            "Неверная структура JSON: ожидается плоский массив [...] "
            'или объект вида { "data": [...] }.'
        )

    if not words_list:
        raise ValueError("Файл vocabulary_base.json не содержит карточек слов.")

    return words_list


def validate_required_fields(words_list):
    for index, item in enumerate(words_list, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"Карточка #{index} должна быть JSON-объектом.")

        for field in TABLE_FIELDS:
            if field not in item:
                raise ValueError(
                    f"Карточка #{index} ('{item.get('word', 'unknown')}') "
                    f"не содержит обязательное поле '{field}'."
                )

        if not isinstance(item["synonyms"], list):
            raise ValueError(
                f"Карточка #{index} ('{item.get('word', 'unknown')}'): "
                "поле 'synonyms' должно быть массивом строк."
            )

        if not all(isinstance(synonym, str) for synonym in item["synonyms"]):
            raise ValueError(
                f"Карточка #{index} ('{item.get('word', 'unknown')}'): "
                "все значения в 'synonyms' должны быть строками."
            )


def normalize_words(words_list):
    return [{field: item[field] for field in TABLE_FIELDS} for item in words_list]


def insert_in_batches(supabase, words_list):
    inserted_count = 0

    for start in range(0, len(words_list), BATCH_SIZE):
        batch = words_list[start : start + BATCH_SIZE]
        response = supabase.table(TABLE_NAME).insert(batch).execute()

        if response.data is None:
            raise RuntimeError(
                "Supabase не вернул данные после вставки. "
                "Проверьте права доступа и настройки таблицы."
            )

        inserted_count += len(response.data)

    return inserted_count


def main():
    try:
        load_dotenv(PROJECT_ROOT / ".env")

        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError(
                "Не найдены SUPABASE_URL и/или SUPABASE_KEY. "
                "Проверьте файл .env в корне проекта."
            )

        supabase_url = normalize_supabase_url(supabase_url)

        print("🔄 Подключение к Supabase...")
        supabase = create_client(supabase_url, supabase_key)

        raw_words_list = load_words(VOCABULARY_FILE)
        validate_required_fields(raw_words_list)
        words_list = normalize_words(raw_words_list)
        print(f"📊 Считывание {len(words_list)} карточек слов...")

        print("🚀 Запуск миграции в облако...")
        inserted_count = insert_in_batches(supabase, words_list)

        if inserted_count != len(words_list):
            raise RuntimeError(
                f"Ожидалось вставить {len(words_list)} записей, "
                f"но Supabase подтвердил {inserted_count}."
            )

        print(f"✅ Успех: Все {inserted_count} слова успешно мигрировали в Supabase!")

    except Exception as error:
        print(f"❌ Ошибка при миграции: {error}")


if __name__ == "__main__":
    main()
