from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from extractors import extract_from_pdf, extract_from_docx, extract_from_url
from quiz_generator import generate_quiz

app = Flask(__name__)
CORS(app)

ALLOWED_EXTENSIONS = {"pdf", "docx"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/extract", methods=["POST"])
def extract():
    """Extract text from uploaded file or URL."""
    text = ""

    if "file" in request.files:
        file = request.files["file"]
        if not allowed_file(file.filename):
            return jsonify({"error": "Only PDF and DOCX files are supported."}), 400
        ext = file.filename.rsplit(".", 1)[1].lower()
        text = extract_from_pdf(file) if ext == "pdf" else extract_from_docx(file)

    elif request.json and request.json.get("url"):
        try:
            text = extract_from_url(request.json["url"])
        except Exception as e:
            return jsonify({"error": f"URL extraction failed: {str(e)}"}), 400
    else:
        return jsonify({"error": "Provide a file or URL."}), 400

    if not text.strip():
        return jsonify({"error": "No text could be extracted."}), 400

    return jsonify({"text": text[:8000], "char_count": len(text)})


@app.route("/api/generate", methods=["POST"])
def generate():
    """Generate quiz from extracted text."""
    data = request.json
    required = ["text", "mode", "difficulty"]
    if not all(k in data for k in required):
        return jsonify({"error": f"Missing fields: {required}"}), 400

    try:
        result = generate_quiz(
            text=data["text"],
            mode=data["mode"],           # mcq | flashcard | both
            difficulty=data["difficulty"],  # easy | medium | hard
            topic_filter=data.get("topic_filter", ""),
            count=int(data.get("count", 5)),
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
