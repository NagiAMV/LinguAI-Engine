# LinguAI backend

This service provides the Engnovate catalog and listening audio proxy used by Next.js.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

On Windows PowerShell, activate with `.venv\\Scripts\\Activate.ps1`.

Install `ffmpeg` and make sure `ffmpeg` is available on `PATH`. The listening endpoint uses it to concatenate the four MP3 sections into one cached file.

## Endpoints

- `GET /health`
- `GET /api/engnovate?resource=reading&query=cambridge+17`
- `GET /api/engnovate/audio?testId=cambridge_19_test_1`

The service caches catalog JSON and stitched MP3 files under `.cache/engnovate`.