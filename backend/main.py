import asyncio
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse

app = FastAPI(title="LinguAI Engnovate Bridge", version="1.0.0")

ENGNOVATE_BASE_URL = os.getenv("ENGNOVATE_BASE_URL", "https://engnovate.com").rstrip("/")
CACHE_DIR = Path(os.getenv("SCRAPER_CACHE_DIR", ".cache/engnovate"))
CACHE_DIR.mkdir(parents=True, exist_ok=True)
CACHE_TTL_SECONDS = int(os.getenv("SCRAPER_CACHE_TTL_SECONDS", "900"))
REQUEST_TIMEOUT = float(os.getenv("SCRAPER_REQUEST_TIMEOUT", "25"))


def safe_cache_key(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def cached_json_path(resource: str, query: str) -> Path:
    return CACHE_DIR / f"{safe_cache_key(f'{resource}:{query}')}.json"


def read_cached_json(path: Path):
    if not path.exists() or (path.stat().st_mtime + CACHE_TTL_SECONDS) < __import__("time").time():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def write_cached_json(path: Path, payload):
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def test_page_path(test_id: str, resource: str) -> str:
    match = re.fullmatch(r"cambridge_(\d+)_test_([1-4])", test_id)
    if not match:
        raise HTTPException(status_code=400, detail="testId must look like cambridge_19_test_1")
    book, test = match.groups()
    return f"{ENGNOVATE_BASE_URL}/cambridge-{book}-{resource}-test-{test}/"


async def fetch_html(url: str) -> str:
    headers = {"User-Agent": "LinguAI-Bridge/1.0 educational research client"}
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, follow_redirects=True, headers=headers) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.text


def extract_audio_urls(html: str, page_url: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    candidates = []
    for tag in soup.find_all(["audio", "source", "a"]):
        for attribute in ("src", "href"):
            value = tag.get(attribute)
            if value and re.search(r"\.mp3(?:\?|$)", value, re.IGNORECASE):
                candidates.append(urljoin(page_url, value))
    for value in re.findall(r"https?[^\"'\s<>]+\.mp3(?:\?[^\"'\s<>]*)?", html, re.IGNORECASE):
        candidates.append(value.replace("\\/", "/"))
    return list(dict.fromkeys(candidates))


def extract_catalog(html: str, page_url: str, resource: str, query: str):
    soup = BeautifulSoup(html, "html.parser")
    items = []
    for link in soup.find_all("a", href=True):
        href = urljoin(page_url, link["href"])
        text = normalize_text(link.get_text(" "))
        if not text or "engnovate.com" not in href:
            continue
        if query.lower() not in f"{text} {href}".lower():
            continue
        if resource == "listening" and not any(word in f"{text} {href}".lower() for word in ("listening", "cambridge")):
            continue
        items.append({"title": text[:160], "url": href, "resource": resource})
    unique = {item["url"]: item for item in items}
    return {"resource": resource, "source": "engnovate", "items": list(unique.values())[:100]}


async def get_test_audio_urls(test_id: str) -> list[str]:
    page_url = test_page_path(test_id, "listening")
    html = await fetch_html(page_url)
    audio_urls = extract_audio_urls(html, page_url)
    if len(audio_urls) < 4:
        raise HTTPException(status_code=502, detail=f"Found {len(audio_urls)} audio files; expected four")
    return audio_urls[:4]


@app.get("/health")
async def health():
    return {"ok": True, "engnovateBaseUrl": ENGNOVATE_BASE_URL, "ffmpeg": bool(shutil.which("ffmpeg"))}


@app.get("/api/engnovate")
async def catalog(resource: str = Query(...), query: str = ""):
    if resource not in {"listening", "reading", "writing", "speaking"}:
        raise HTTPException(status_code=400, detail="Unsupported resource")
    cache_path = cached_json_path(resource, query)
    cached = read_cached_json(cache_path)
    if cached is not None:
        return cached
    page_url = f"{ENGNOVATE_BASE_URL}/?s={resource}+{query}" if query else ENGNOVATE_BASE_URL
    payload = extract_catalog(await fetch_html(page_url), page_url, resource, query)
    write_cached_json(cache_path, payload)
    return payload


@app.get("/api/engnovate/audio")
async def stitched_audio(testId: str = Query(...)):
    if not shutil.which("ffmpeg"):
        raise HTTPException(status_code=503, detail="ffmpeg is required to stitch listening audio")
    cache_path = CACHE_DIR / f"{safe_cache_key(testId)}.mp3"
    if cache_path.exists() and cache_path.stat().st_mtime + CACHE_TTL_SECONDS > __import__("time").time():
        return FileResponse(cache_path, media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=3600"})

    audio_urls = await get_test_audio_urls(testId)
    with tempfile.TemporaryDirectory() as temporary_dir:
        temporary_path = Path(temporary_dir)
        downloaded = []
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, follow_redirects=True) as client:
            for index, url in enumerate(audio_urls):
                response = await client.get(url)
                response.raise_for_status()
                path = temporary_path / f"part-{index}.mp3"
                path.write_bytes(response.content)
                downloaded.append(path)
        concat_file = temporary_path / "inputs.txt"
        concat_file.write_text("\n".join(f"file '{path.as_posix()}'" for path in downloaded), encoding="utf-8")
        subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_file), "-c", "copy", str(cache_path)], check=True, capture_output=True)
    return FileResponse(cache_path, media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=3600"})


@app.exception_handler(httpx.HTTPError)
async def http_error_handler(_, error):
    return JSONResponse(status_code=502, content={"detail": f"Engnovate request failed: {error.__class__.__name__}"})