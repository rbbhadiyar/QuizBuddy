# 🧠 QuizBuddy — AI Study Buddy

QuizBuddy is an AI-powered study assistant that transforms your study material into interactive quizzes and flashcards instantly. Simply upload a PDF, Word document, or paste a URL — QuizBuddy extracts the content, detects key topics using prompt chaining, and generates MCQs or flashcards tailored to your chosen difficulty level. It's built to make revision faster, smarter, and more engaging.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask, Flask-CORS |
| AI / LLM | Groq API (`llama-3.1-8b-instant`) via OpenAI-compatible SDK |
| PDF Extraction | PyMuPDF (fitz) |
| DOCX Extraction | python-docx |
| URL Extraction | Requests + BeautifulSoup4 |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Config | python-dotenv |

## 📁 Project Structure

```
QuizBuddy/
├── app.py              # Flask server & API routes
├── extractors.py       # PDF, DOCX, URL text extraction
├── quiz_generator.py   # Prompt chaining + output parsing
├── requirements.txt    # Python dependencies
├── .env                # API key (not pushed to GitHub)
├── assets/             # Screenshots & demo
├── static/
│   ├── style.css
│   └── app.js
└── templates/
    └── index.html
```

## ⚙️ Setup & Installation

**1. Clone the repository**
```bash
git clone https://github.com/rbbhadiyar/QuizBuddy.git
cd QuizBuddy
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
```

**3. Configure your API key**

Create a `.env` file in the root directory:
```
OPENAI_API_KEY=your_groq_api_key_here
```
Get your free Groq API key at: https://console.groq.com

**4. Run the app**
```bash
python app.py
```

Open **http://localhost:5000** in your browser.

## ✨ Features

- 📄 Upload **PDF** or **DOCX** files
- 🔗 Extract content from any **URL**
- 🤖 Auto-detects **key topics** using AI
- 📝 Generates **MCQs** with 4 options, correct answer & explanation
- 🃏 Generates **Flashcards** with flip animation
- 🎯 Three **difficulty levels** — Easy, Medium, Hard
- 🔍 **Topic filter** to focus on specific subjects
- 📊 **Score tracking** after MCQ submission
- ⬇️ **Export quiz** as JSON

## 🖥️ Screenshot

### Input & Configuration
![Input Screen](assets/Screenshot%202026-05-20%20145637.png)

## 🎥 Demo

https://github.com/user-attachments/assets/0beb6749-f866-49b7-99b9-2f8a9db5dc4c
