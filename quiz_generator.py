import json
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

DIFFICULTY_HINTS = {
    "easy": "Use simple language. Focus on basic definitions and facts.",
    "medium": "Include conceptual understanding and application-based questions.",
    "hard": "Include analysis, inference, and multi-step reasoning questions.",
}


def _chat(messages: list, model="llama-3.1-8b-instant") -> str:
    response = client.chat.completions.create(model=model, messages=messages)
    return response.choices[0].message.content.strip()


# ── Chain Step 1: Extract key topics from raw text ──────────────────────────
def extract_topics(text: str, topic_filter: str = None) -> str:
    prompt = f"Extract the main educational topics from the following text as a concise bullet list."
    if topic_filter:
        prompt += f" Focus only on topics related to: {topic_filter}."
    prompt += f"\n\nText:\n{text[:6000]}"

    return _chat([
        {"role": "system", "content": "You are an expert educator and content analyst."},
        {"role": "user", "content": prompt},
    ])


# ── Chain Step 2: Generate MCQs from topics + text ──────────────────────────
def generate_mcqs(text: str, topics: str, difficulty: str, count: int = 5) -> list:
    hint = DIFFICULTY_HINTS.get(difficulty, DIFFICULTY_HINTS["medium"])
    prompt = f"""You are a quiz generator. Based on the topics and source text below, generate {count} multiple-choice questions.

Difficulty: {difficulty.upper()} — {hint}

Topics:
{topics}

Source Text (excerpt):
{text[:5000]}

Return ONLY a JSON array in this exact format:
[
  {{
    "question": "...",
    "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
    "answer": "A",
    "explanation": "..."
  }}
]"""

    raw = _chat([
        {"role": "system", "content": "You are a precise quiz generator. Output only valid JSON."},
        {"role": "user", "content": prompt},
    ])
    return _parse_json(raw)


# ── Chain Step 3: Generate Flashcards ───────────────────────────────────────
def generate_flashcards(text: str, topics: str, difficulty: str, count: int = 5) -> list:
    hint = DIFFICULTY_HINTS.get(difficulty, DIFFICULTY_HINTS["medium"])
    prompt = f"""Generate {count} flashcards from the topics and text below.

Difficulty: {difficulty.upper()} — {hint}

Topics:
{topics}

Source Text (excerpt):
{text[:5000]}

Return ONLY a JSON array:
[
  {{
    "front": "Question or term",
    "back": "Answer or definition"
  }}
]"""

    raw = _chat([
        {"role": "system", "content": "You are a flashcard creator. Output only valid JSON."},
        {"role": "user", "content": prompt},
    ])
    return _parse_json(raw)


# ── Output Parser ────────────────────────────────────────────────────────────
def _parse_json(raw: str) -> list:
    """Strip markdown fences and parse JSON safely."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    return json.loads(cleaned.strip())


# ── Public entry point ───────────────────────────────────────────────────────
def generate_quiz(text: str, mode: str, difficulty: str, topic_filter: str, count: int) -> dict:
    topics = extract_topics(text, topic_filter)
    result = {"topics": topics, "difficulty": difficulty, "mode": mode}

    if mode == "mcq":
        result["questions"] = generate_mcqs(text, topics, difficulty, count)
    elif mode == "flashcard":
        result["flashcards"] = generate_flashcards(text, topics, difficulty, count)
    else:  # both
        result["questions"] = generate_mcqs(text, topics, difficulty, count)
        result["flashcards"] = generate_flashcards(text, topics, difficulty, count)

    return result
