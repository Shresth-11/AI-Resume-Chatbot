# 🤖 AI Resume & Portfolio Chatbot

> An interactive, AI-powered portfolio assistant that allows recruiters and hiring managers to ask questions and explore candidate credentials directly from their resume in real time.

[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://resume-ai-chatbot-e39p.onrender.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Groq](https://img.shields.io/badge/Groq-Fast%20Inference-F05032?style=for-the-badge)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 🌐 Live Application

Explore the deployed app live:  
👉 **[https://resume-ai-chatbot-e39p.onrender.com/](https://resume-ai-chatbot-e39p.onrender.com/)**

---

## 📌 Overview

Traditional resumes require recruiters to manually skim pages to find specific qualifications, tech stacks, or project experience. 

**AI Resume Chatbot** transforms this experience into an interactive conversation. Recruiters can drag and drop a PDF or DOCX resume and instantly query candidate details—such as years of experience, relevant tech stacks, major accomplishments, or educational background. 

Powered by **Groq's LPU inference engine**, responses stream back with near-zero latency while adhering to strict prompt boundaries to eliminate hallucinations.

---

## ✨ Key Features

- **📄 Universal Document Parsing**: Seamlessly extract clean text from `.pdf` (using `pypdf`) and `.docx` (using `python-docx`) files.
- **⚡ Ultra-Low Latency Streaming**: Powered by Groq's high-speed inference engine using Server-Sent Events (SSE) for token-by-token streaming.
- **🛡️ Strict Context Grounding**: The LLM is strictly constrained to answers found *only* within the uploaded resume, preventing hallucinations or false claims.
- **🎨 Modern Responsive Interface**: Clean, polished glassmorphism design built with vanilla HTML5/CSS3/JavaScript featuring drag-and-drop file uploads and live typing animations.
- **☁️ Cloud Deployed**: Production-ready setup hosted seamlessly on Render.

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/), [Uvicorn](https://www.uvicorn.org/) |
| **AI / LLM** | [Groq API](https://console.groq.com/) (`openai/gpt-oss-120b`) |
| **Document Processing** | `pypdf`, `python-docx` |
| **Frontend** | HTML5, CSS3 (Modern Glassmorphic UI), Vanilla JavaScript |
| **Streaming Protocol** | Server-Sent Events (SSE) |
| **Deployment** | [Render](https://render.com) |

---

## 📁 Project Structure

```text
personal_resume_chatbot/
├── backend/
│   ├── app.py             # FastAPI backend, text extraction & Groq SSE streaming
│   └── requirements.txt   # Python package dependencies
├── frontend/
│   ├── index.html         # Responsive web interface
│   ├── style.css          # Design system, layout & animations
│   └── script.js          # File upload handler & SSE stream consumer
├── .gitignore             # Git ignore configuration
└── README.md              # Project documentation
```

---

## 🚀 Getting Started

Follow these instructions to run the application locally on your machine.

### Prerequisites

- **Python 3.10+** installed
- A free **Groq API Key** from [Groq Console](https://console.groq.com/keys)

### 1. Clone the Repository

```bash
git clone https://github.com/Shresth-11/AI-Resume-Chatbot.git
cd AI-Resume-Chatbot
```

### 2. Set Up Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory (or `backend/` directory):

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 5. Launch the Application

```bash
uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
```

Open your browser and navigate to:  
👉 **`http://127.0.0.1:8000`**

---

## ⚙️ How It Works

```
┌─────────────────┐       Upload (.pdf / .docx)       ┌────────────────────────┐
│                 ├──────────────────────────────────►│ FastAPI Backend        │
│                 │                                   │ - pypdf / python-docx  │
│  User Browser   │                                   │ - Text Extraction      │
│  (Frontend UI)  │                                   └───────────┬────────────┘
│                 │                                               │
│                 │       User Query + SSE Streaming              ▼
│                 │◄──────────────────────────────────┬────────────────────────┐
└─────────────────┘                                   │ Groq API Inference     │
                                                      │ - System Prompt Bound  │
                                                      │ - Low-latency Tokens   │
                                                      └────────────────────────┘
```

1. **Upload**: User uploads a resume via drag-and-drop or file picker.
2. **Extraction**: The FastAPI endpoint reads the file buffer and extracts paragraphs and tables.
3. **Session Context**: The resume text is loaded into memory for the active session.
4. **Chat**: When the user asks a question, the backend formats a strict context-bound system prompt.
5. **Streaming**: Groq processes the prompt and streams tokens back to the frontend in real time.

---

## ☁️ Deployment

### Option 1: Deploy on Render

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** ➔ **Web Service**.
3. Connect your repository: `https://github.com/Shresth-11/AI-Resume-Chatbot`.
4. Configure the settings:
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`
5. In **Environment Variables**, add:
   - `GROQ_API_KEY`: `<your_groq_api_key>`
6. Click **Deploy Web Service**.

---

### Option 2: Deploy on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** ➔ **Project**.
3. Import your GitHub repository: `https://github.com/Shresth-11/AI-Resume-Chatbot`.
4. Under **Environment Variables**, add:
   - `GROQ_API_KEY`: `<your_groq_api_key>`
5. Click **Deploy**. Vercel will automatically use `vercel.json` and `api/index.py` to launch your app.

---

## 👨‍💻 Author

**Shresth Jaiswal**  
- **GitHub**: [@Shresth-11](https://github.com/Shresth-11)  
- **Email**: jaisshresth143@gmail.com  
- **Live Demo**: [resume-ai-chatbot-e39p.onrender.com](https://resume-ai-chatbot-e39p.onrender.com/)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
