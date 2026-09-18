# LinguAI Bridge: Empowering Education through AI

## 🎯 Mission
To bridge the educational gap in Uzbekistan by providing high-level academic resources and AI-driven feedback to students striving for international academic excellence (IELTS 8.0+).

## 🛠 Tech Stack (Roadmap)
- **Frontend:** Next.js (React) for a seamless user experience.
- **Backend/DB:** Supabase for real-time vocabulary tracking and user progress.
- **AI Engine:** Integration with LLMs (via Hugging Face/OpenAI) for context-aware synonym generation and essay analysis.

## 🚀 Key Features
- **Smart Vocabulary Parser:** Extracts academic lexis from complex IELTS passages.
- **Contextual Learning:** Moves beyond simple translation to deep semantic understanding.
- **Teacher-Student Sync:** Tools for individual and group lesson management.

## 📈 Project Status
Currently in **Active MVP Development**. 
- [x] Repository initialized.
- [ ] Vocabulary database schema design.
- [ ] Integration of the first 340-word academic list.

## Local practice backend

The Next.js app can use the optional Python service in `backend/` for Engnovate catalog data and stitched listening audio. Start it with `uvicorn backend.main:app --reload --port 8000`, then set `ENGNOVATE_SCRAPER_URL` and `LISTENING_SCRAPER_URL` in `.env.local`.

For free local AI feedback, install Ollama, pull a model such as `llama3.2:3b`, and set `AI_PROVIDER=ollama`. The Writing and Speaking evaluator will then use `http://127.0.0.1:11434` without a paid API key.
