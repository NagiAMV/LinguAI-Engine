import os
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv
from supabase import create_client


PROJECT_ROOT = Path(__file__).resolve().parent
TABLE_NAME = "vocabulary"


def normalize_supabase_url(raw_url):
    url = raw_url.strip().strip('"').strip("'").rstrip("/")
    parsed_url = urlparse(url)

    if not parsed_url.scheme or not parsed_url.netloc:
        raise ValueError("SUPABASE_URL must be a valid URL, for example https://project-id.supabase.co")

    return f"{parsed_url.scheme}://{parsed_url.netloc}"


def main():
    try:
        load_dotenv(PROJECT_ROOT / ".env")

        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError(
                "SUPABASE_URL and/or SUPABASE_KEY are missing. Check your .env file."
            )

        supabase_url = normalize_supabase_url(supabase_url)
        supabase = create_client(supabase_url, supabase_key)
        supabase.table(TABLE_NAME).select("id,word").limit(1).execute()

        print("Связь с Supabase установлена!")

    except Exception as error:
        print(f"Ошибка подключения к Supabase: {error}")


if __name__ == "__main__":
    main()
