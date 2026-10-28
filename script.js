
// ============================================
// TranslateAI - Language Assistant
// ============================================

// DOM ELEMENTS

const greeting = document.getElementById("greeting");
const welcome = document.getElementById("welcome");
const messages = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

const sourceLanguage = document.getElementById("sourceLanguage");
const targetLanguage = document.getElementById("targetLanguage");

const historyContainer = document.getElementById("chatHistory");
const newChatButton = document.getElementById("newChat");
const uploadButton = document.getElementById("uploadButton");
const imageInput = document.getElementById("imageInput");
const micButton = document.getElementById("micButton");

const translateMode = document.getElementById("translateMode");
const voiceMode = document.getElementById("voiceMode");
const scanMode = document.getElementById("scanMode");
const vocabularyMode = document.getElementById("vocabularyMode");

const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");


// APPLICATION STATE

let mode = "translate";
let busy = false;

let chats = [];
let currentChatId = null;

const STORAGE_KEY = "translateai_chats_v2";


// Language codes used by browser speech recognition and speech synthesis.

const SPEECH_LANGUAGES = {
    "en": "en-US",
    "ur": "ur-PK",
    "hi": "hi-IN",
    "ar": "ar-SA",
    "fr": "fr-FR",
    "de": "de-DE",
    "es": "es-ES",
    "it": "it-IT",
    "tr": "tr-TR",
    "zh-CN": "zh-CN",
    "ja": "ja-JP",
    "ko": "ko-KR",
    "pt": "pt-PT",
    "ru": "ru-RU",
    "nl": "nl-NL",
    "bn": "bn-IN",
    "fa": "fa-IR",
    "pa": "pa-IN",
    "id": "id-ID",
    "ms": "ms-MY",
    "sw": "sw-TZ"
};


// ============================================
// GREETING
// ============================================

function updateGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) {
        greeting.textContent = "Good morning! ☀️";
    } else if (hour < 17) {
        greeting.textContent = "Good afternoon! ✨";
    } else if (hour < 21) {
        greeting.textContent = "Good evening! 🌆";
    } else {
        greeting.textContent = "Good night! 🌙";
    }
}

updateGreeting();


// ============================================
// LANGUAGE HELPERS
// ============================================

function getSelectedLanguageName(selectElement) {
    if (!selectElement || selectElement.selectedIndex < 0) {
        return "";
    }

    return selectElement.options[
        selectElement.selectedIndex
    ].text.replace(/^(From|To):\s*/i, "").trim();
}


function getSpeechLanguage(languageCode) {
    return SPEECH_LANGUAGES[languageCode] || languageCode || "en-US";
}


function updateInputPlaceholder() {
    const sourceName = getSelectedLanguageName(sourceLanguage);

    if (sourceLanguage.value && sourceName) {
        input.placeholder = `Type your text in ${sourceName}...`;
    } else {
        input.placeholder = "Select the language you are writing in, then type here...";
    }
}


// Update the placeholder when the source language changes.

sourceLanguage.addEventListener("change", updateInputPlaceholder);


// ============================================
// CHAT STORAGE
// ============================================

function saveChats() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(chats)
        );
    } catch (error) {
        console.warn("Chat history could not be saved:", error);
    }
}


function loadChats() {
    try {
        const savedChats = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        chats = Array.isArray(savedChats) ? savedChats : [];

    } catch (error) {
        chats = [];
    }

    if (chats.length > 0) {
        currentChatId = chats[0].id;
    }

    renderHistory();
}


function createChat() {
    const chat = {
        id: Date.now().toString() +
            Math.random().toString(36).slice(2),
        title: "New conversation",
        messages: []
    };

    chats.unshift(chat);
    currentChatId = chat.id;

    saveChats();
    renderHistory();
    renderMessages();

    input.focus();
}


function getCurrentChat() {
    return chats.find(
        chat => chat.id === currentChatId
    );
}


// ============================================
// CHAT HISTORY
// ============================================

function renderHistory() {
    historyContainer.innerHTML = "";

    chats.forEach(chat => {
        const item = document.createElement("div");

        item.className = "history-item";

        if (chat.id === currentChatId) {
            item.classList.add("selected");
        }

        const title = document.createElement("span");

        title.className = "history-title";
        title.textContent = chat.title;

        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-chat";
        deleteButton.textContent = "×";
        deleteButton.title = "Delete conversation";
        deleteButton.setAttribute(
            "aria-label",
            "Delete conversation"
        );

        deleteButton.addEventListener("click", event => {
            event.stopPropagation();

            chats = chats.filter(
                existingChat => existingChat.id !== chat.id
            );

            if (currentChatId === chat.id) {
                currentChatId = chats.length
                    ? chats[0].id
                    : null;
            }

            saveChats();
            renderHistory();
            renderMessages();
        });

        item.appendChild(title);
        item.appendChild(deleteButton);

        item.addEventListener("click", () => {
            currentChatId = chat.id;

            renderHistory();
            renderMessages();
        });

        historyContainer.appendChild(item);
    });
}


// ============================================
// MESSAGES
// ============================================

function addMessage(role, text, meta = "") {
    let chat = getCurrentChat();

    if (!chat) {
        createChat();
        chat = getCurrentChat();
    }

    chat.messages.push({
        role,
        text,
        meta
    });

    if (
        role === "user" &&
        chat.title === "New conversation"
    ) {
        chat.title = text.slice(0, 35);
    }

    saveChats();
    renderHistory();
    renderMessages();
}


function renderMessages() {
    messages.innerHTML = "";

    const chat = getCurrentChat();

    const hasMessages = Boolean(
        chat && chat.messages.length > 0
    );

    welcome.style.display = hasMessages
        ? "none"
        : "block";

    if (!hasMessages) {
        return;
    }

    chat.messages.forEach(message => {
        const wrapper = document.createElement("div");

        wrapper.className = "message " + message.role;

        const bubble = document.createElement("div");

        bubble.className = "message-bubble";

        const content = document.createElement("div");

        content.textContent = message.text;

        bubble.appendChild(content);

        if (message.meta) {
            const meta = document.createElement("div");

            meta.className = "message-meta";
            meta.textContent = message.meta;

            bubble.appendChild(meta);
        }

        // Add a Listen button to assistant responses.

        if (message.role === "assistant") {
            const speak = document.createElement("button");

            speak.textContent = "🔊 Listen";
            speak.style.marginTop = "12px";
            speak.style.border = "none";
            speak.style.background = "transparent";
            speak.style.color = "#6958e8";
            speak.style.cursor = "pointer";

            speak.addEventListener("click", () => {
                speakText(message.text);
            });

            bubble.appendChild(speak);
        }

        wrapper.appendChild(bubble);
        messages.appendChild(wrapper);
    });

    const chatArea = document.getElementById("chatArea");

    chatArea.scrollTop = chatArea.scrollHeight;
}


// ============================================
// TRANSLATION
// ============================================

async function sendMessage() {
    if (busy) {
        return;
    }

    const text = input.value.trim();

    if (!text) {
        return;
    }

    // Require the user to choose both languages.

    const selectedSource = sourceLanguage.value;
    const selectedTarget = targetLanguage.value;

    if (!selectedSource) {
        alert("Please select the language you are writing in.");
        sourceLanguage.focus();
        return;
    }

    if (!selectedTarget) {
        alert("Please select the language you want to translate into.");
        targetLanguage.focus();
        return;
    }

    const selectedSourceName =
        getSelectedLanguageName(sourceLanguage);

    const selectedTargetName =
        getSelectedLanguageName(targetLanguage);

    busy = true;
    sendButton.disabled = true;

    const originalButtonText = sendButton.textContent;

    sendButton.textContent = "…";

    input.value = "";

    addMessage(
        "user",
        text,
        "From: " + selectedSourceName +
        " · To: " + selectedTargetName
    );

    const requestChatId = currentChatId;

    try {
        const response = await fetch("/translate", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            // Send BOTH selected language codes to Flask.

            body: JSON.stringify({
                text: text,
                source: selectedSource,
                target: selectedTarget
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.error || "Translation failed."
            );
        }

        // Keep the result in the conversation that started the request.

        const chat = chats.find(
            existingChat => existingChat.id === requestChatId
        );

        if (chat) {
            let translated =
                result.translated_text ||
                result.translation ||
                "";

            if (!translated) {
                throw new Error(
                    "The translation service returned an empty result."
                );
            }

            if (mode === "vocabulary") {
                translated =
                    "Vocabulary translation:\n\n" + translated;
            }

            chat.messages.push({
                role: "assistant",
                text: translated,

                meta:
                    "Translated from " +
                    selectedSourceName +
                    " to " +
                    selectedTargetName
            });

            saveChats();

            if (currentChatId === requestChatId) {
                renderMessages();
            }
        }

    } catch (error) {
        const chat = chats.find(
            existingChat => existingChat.id === requestChatId
        );

        if (chat) {
            chat.messages.push({
                role: "assistant",
                text: "⚠️ " + error.message,
                meta: ""
            });

            saveChats();

            if (currentChatId === requestChatId) {
                renderMessages();
            }
        }

    } finally {
        busy = false;
        sendButton.disabled = false;
        sendButton.textContent = originalButtonText;
    }
}


// ============================================
// TEXT-TO-SPEECH
// ============================================

function speakText(text) {
    if (!("speechSynthesis" in window)) {
        alert(
            "Speech playback is not supported in this browser."
        );
        return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = getSpeechLanguage(
        targetLanguage.value
    );

    utterance.rate = 0.9;

    speechSynthesis.speak(utterance);
}


// ============================================
// VOICE INPUT
// ============================================

function startVoice() {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert(
            "Voice recognition is not supported in this browser. " +
            "Try a supported version of Chrome or Edge."
        );
        return;
    }

    // Voice recognition uses the language selected by the user.

    if (!sourceLanguage.value) {
        alert(
            "Please select the language you will speak in first."
        );

        sourceLanguage.focus();
        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = getSpeechLanguage(
        sourceLanguage.value
    );

    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        input.placeholder = "Listening... Speak now.";
        micButton.disabled = true;
    };

    recognition.onresult = event => {
        const transcript =
            event.results[0][0].transcript;

        input.value = transcript;
        input.focus();
    };

    recognition.onerror = event => {
        let message = "Voice recognition error: " + event.error;

        if (event.error === "not-allowed") {
            message =
                "Microphone access was denied. " +
                "Allow microphone access in your browser settings.";
        } else if (event.error === "no-speech") {
            message =
                "No speech was detected. Please try speaking again.";
        }

        alert(message);
    };

    recognition.onend = () => {
        micButton.disabled = false;
        updateInputPlaceholder();
    };

    try {
        recognition.start();
    } catch (error) {
        micButton.disabled = false;
        updateInputPlaceholder();

        alert(
            "Could not start voice recognition. Please try again."
        );
    }
}


// ============================================
// IMAGE SCANNING / OCR
// ============================================

async function scanImage(file) {
    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert(
            "Please select an image smaller than 10 MB."
        );
        return;
    }

    if (!window.Tesseract) {
        alert(
            "The image scanning library could not load. " +
            "Check your internet connection and try again."
        );
        return;
    }

    const previousPlaceholder = input.placeholder;

    input.placeholder = "Scanning image... Please wait.";

    uploadButton.disabled = true;
    scanMode.disabled = true;

    try {
        // Tesseract uses its own trained-data language codes.
        // These differ from some translation API codes.

        const OCR_LANGUAGES = {
            "en": "eng",
            "ur": "urd",
            "hi": "hin",
            "ar": "ara",
            "fr": "fra",
            "de": "deu",
            "es": "spa",
            "it": "ita",
            "zh-CN": "chi_sim",
            "ja": "jpn",
            "ko": "kor",
            "pt": "por",
            "ru": "rus",
            "nl": "nld",
            "bn": "ben"
        };

        const selectedOCRLanguage =
            OCR_LANGUAGES[sourceLanguage.value] || "eng";

        const result = await Tesseract.recognize(
            file,
            selectedOCRLanguage
        );

        const extractedText = result.data.text.trim();

        if (!extractedText) {
            alert(
                "No readable text was found in this image."
            );
            return;
        }

        input.value = extractedText;
        input.focus();

    } catch (error) {
        alert(
            "Image scanning failed. The selected OCR language " +
            "may not be available, or the image may be unreadable.\n\n" +
            error.message
        );

    } finally {
        input.placeholder = previousPlaceholder;

        uploadButton.disabled = false;
        scanMode.disabled = false;

        imageInput.value = "";
    }
}


// ============================================
// FEATURE MODES
// ============================================

function setMode(selectedMode) {
    mode = selectedMode;

    document.querySelectorAll(".feature").forEach(button => {
        button.classList.remove("active");
    });

    const placeholders = {
        translate:
            "Type your text in the language you select below...",

        voice:
            "Select your language and use the microphone or type...",

        scan:
            "Select the text language, then upload an image...",

        vocabulary:
            "Select both languages and enter a word..."
    };

    input.placeholder = placeholders[mode];

    if (mode === "translate") {
        translateMode.classList.add("active");
    }

    if (mode === "voice") {
        voiceMode.classList.add("active");
        startVoice();
    }

    if (mode === "scan") {
        scanMode.classList.add("active");

        if (!sourceLanguage.value) {
            alert(
                "Select the language written in your image first."
            );

            sourceLanguage.focus();
            return;
        }

        imageInput.click();
    }

    if (mode === "vocabulary") {
        vocabularyMode.classList.add("active");
    }
}


// ============================================
// EVENT LISTENERS
// ============================================

sendButton.addEventListener("click", sendMessage);


input.addEventListener("keydown", event => {
    if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
    ) {
        event.preventDefault();
        sendMessage();
    }
});


newChatButton.addEventListener("click", createChat);


uploadButton.addEventListener("click", () => {
    if (!sourceLanguage.value) {
        alert(
            "Select the language written in your image first."
        );

        sourceLanguage.focus();
        return;
    }

    imageInput.click();
});


imageInput.addEventListener("change", event => {
    scanImage(event.target.files[0]);
});


micButton.addEventListener("click", startVoice);


translateMode.addEventListener("click", () => {
    setMode("translate");
});


voiceMode.addEventListener("click", () => {
    setMode("voice");
});


scanMode.addEventListener("click", () => {
    setMode("scan");
});


vocabularyMode.addEventListener("click", () => {
    setMode("vocabulary");
});


document.querySelectorAll(".suggestion").forEach(button => {
    button.addEventListener("click", () => {
        input.value = button.dataset.text || "";
        input.focus();
    });
});


menuButton.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});


// ============================================
// INITIALIZE
// ============================================

loadChats();

if (!currentChatId) {
    welcome.style.display = "block";
}

renderMessages();
updateInputPlaceholder();
