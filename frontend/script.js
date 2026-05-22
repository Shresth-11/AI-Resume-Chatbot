const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const uploadStatus = document.getElementById("upload-status");
const uploadedFilename = document.getElementById("uploaded-filename");
const clearBtn = document.getElementById("clear-btn");
const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

let resumeUploaded = false;
let isStreaming = false;

// ===== Upload Logic =====

dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
});

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) uploadFile(file);
});

clearBtn.addEventListener("click", () => {
    resumeUploaded = false;
    uploadStatus.classList.add("hidden");
    dropZone.classList.remove("hidden");
    chatInput.disabled = true;
    sendBtn.disabled = true;
    fileInput.value = "";
    addBotMessage("Resume removed. Please upload a new one to continue.");
});

async function uploadFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx"].includes(ext)) {
        addBotMessage("⚠️ Only PDF and DOCX files are supported. Please try again.");
        return;
    }

    dropZone.classList.add("hidden");
    addBotMessage("📤 Uploading resume...");

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) {
            addBotMessage("❌ " + (data.error || "Upload failed. Please try again."));
            dropZone.classList.remove("hidden");
            return;
        }

        resumeUploaded = true;
        uploadedFilename.textContent = data.filename;
        uploadStatus.classList.remove("hidden");
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();

        addBotMessage("✅ Resume uploaded! Ask me anything about the candidate — skills, experience, education, projects, etc.");
    } catch (err) {
        addBotMessage("❌ Network error. Make sure the server is running.");
        dropZone.classList.remove("hidden");
    }
}

// ===== Chat Logic =====

chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg || isStreaming || !resumeUploaded) return;
    sendMessage(msg);
});

async function sendMessage(message) {
    addUserMessage(message);
    chatInput.value = "";
    isStreaming = true;
    chatInput.disabled = true;
    sendBtn.disabled = true;

    // Create bot message container with typing indicator
    const messageDiv = document.createElement("div");
    messageDiv.className = "message bot-message";
    messageDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-bubble">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();

    const bubble = messageDiv.querySelector(".message-bubble");

    try {
        const res = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        if (!res.ok) {
            bubble.innerHTML = "<p>❌ Something went wrong. Please try again.</p>";
            finishStreaming();
            return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        bubble.innerHTML = "<p></p>";
        const textEl = bubble.querySelector("p");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const payload = line.slice(6).trim();
                if (payload === "[DONE]") break;

                try {
                    const parsed = JSON.parse(payload);
                    if (parsed.token) {
                        fullText += parsed.token;
                        textEl.innerHTML = formatText(fullText);
                        scrollToBottom();
                    }
                } catch (_) {}
            }
        }

        if (!fullText.trim()) {
            bubble.innerHTML = "<p>🤔 No response received. Try asking again.</p>";
        }
    } catch (err) {
        bubble.innerHTML = "<p>❌ Network error. Make sure the server is running.</p>";
    }

    finishStreaming();
}

function finishStreaming() {
    isStreaming = false;
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.focus();
}

// ===== Message Helpers =====

function addUserMessage(text) {
    const div = document.createElement("div");
    div.className = "message user-message";
    div.innerHTML = `
        <div class="message-avatar">👤</div>
        <div class="message-bubble"><p>${escapeHtml(text)}</p></div>
    `;
    chatMessages.appendChild(div);
    scrollToBottom();
}

function addBotMessage(text) {
    const div = document.createElement("div");
    div.className = "message bot-message";
    div.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-bubble"><p>${text}</p></div>
    `;
    chatMessages.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function formatText(text) {
    // Bold: **text**
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Bullet points: lines starting with - or *
    text = text.replace(/^[\-\*]\s+(.+)$/gm, "<li>$1</li>");
    if (text.includes("<li>")) {
        text = text.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
    }
    // Line breaks
    text = text.replace(/\n/g, "<br>");
    return text;
}
