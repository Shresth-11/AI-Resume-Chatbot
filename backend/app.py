import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from groq import Groq
from pypdf import PdfReader
from docx import Document
import json
import io

# Fix encoding on Windows
if sys.stdout and hasattr(sys.stdout, 'encoding') and sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Load env: try local .env files, then fall back to system environment variables (Render)
load_dotenv()
for env_candidate in [
    Path(__file__).resolve().parent / ".env",
    Path(__file__).resolve().parent.parent / ".env",
    Path(__file__).resolve().parent.parent.parent / ".env",
]:
    if env_candidate.exists():
        load_dotenv(dotenv_path=env_candidate)

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY not found. Set it in .env locally or as an environment variable on your hosting platform.")

client = Groq(api_key=api_key)
model = "openai/gpt-oss-120b"

# Candidate information
CANDIDATE_NAME = "Shresth Jaiswal"

# Frontend directory resolution (works for local, Render, and Vercel)
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
for candidate in [
    Path(__file__).resolve().parent.parent / "frontend",
    Path(__file__).resolve().parent / "frontend",
    Path.cwd() / "frontend",
]:
    if candidate.exists():
        FRONTEND_DIR = candidate
        break

app = FastAPI(title="Shresth Jaiswal — AI Resume Chatbot API")
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

# In-memory store for resume text (per session — simple approach)
resume_store = {"text": None}

SYSTEM_PROMPT = f"""You are a professional AI assistant embedded in {CANDIDATE_NAME}'s portfolio website.
Your ONLY job is to answer questions about {CANDIDATE_NAME} based on their resume.

STRICT RULES:
1. ONLY answer questions that can be answered from the resume provided below about {CANDIDATE_NAME}.
2. If a question is NOT related to {CANDIDATE_NAME} or their resume, politely refuse.
   Say: "I can only answer questions about {CANDIDATE_NAME}'s resume. Please ask something related to their skills, experience, education, or projects."
3. Do NOT make up or infer information that is not explicitly in the resume.
4. Be professional, concise, and helpful — remember, HR recruiters are asking.
5. Format answers cleanly. Use bullet points where appropriate.
6. If the resume has not been uploaded yet, say: "No resume has been uploaded yet. Please upload {CANDIDATE_NAME}'s resume first."

RESUME:
{{resume_text}}
"""


def extract_pdf_text(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text


def extract_docx_text(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    text = ""
    for para in doc.paragraphs:
        if para.text.strip():
            text += para.text + "\n"
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if cell.text.strip():
                    text += cell.text + "\n"
    return text


@app.api_route("/", methods=["GET", "HEAD"])
async def serve_index():
    return FileResponse(str(FRONTEND_DIR / "index.html"))


@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "healthy"}


@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename:
        return JSONResponse({"error": "No file provided"}, status_code=400)

    ext = Path(file.filename).suffix.lower()
    if ext not in [".pdf", ".docx"]:
        return JSONResponse({"error": "Only PDF and DOCX files are supported"}, status_code=400)

    file_bytes = await file.read()

    if ext == ".pdf":
        text = extract_pdf_text(file_bytes)
    else:
        text = extract_docx_text(file_bytes)

    if not text.strip():
        return JSONResponse({"error": "Could not extract text from the file"}, status_code=400)

    resume_store["text"] = text
    return {"message": "Resume uploaded successfully", "filename": file.filename, "resume_text": text}


@app.post("/chat")
async def chat(request: Request):
    body = await request.json()
    user_message = body.get("message", "").strip()

    if not user_message:
        return JSONResponse({"error": "Empty message"}, status_code=400)

    # Use client-passed resume text (supports serverless / Vercel) or fallback to server memory (Render)
    resume_text = body.get("resume_text") or resume_store.get("text") or "No resume uploaded yet."
    system_content = SYSTEM_PROMPT.format(resume_text=resume_text)

    messages = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_message}
    ]

    def generate():
        stream = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.3,
            max_tokens=1024,
            stream=True
        )
        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield f"data: {json.dumps({'token': delta.content})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
