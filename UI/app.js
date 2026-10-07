const API_BASE_URL = 'http://localhost:8080';
const promptInput = document.querySelector('#promptInput');
const chatForm = document.querySelector('#chatForm');
const sendButton = document.querySelector('#sendButton');
const messages = document.querySelector('#messages');
const emptyState = document.querySelector('#emptyState');
const fileInput = document.querySelector('#fileInput');
const fileStatus = document.querySelector('#fileStatus');
const toast = document.querySelector('#toast');

let toastTimer;

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function resizeInput() {
    promptInput.style.height = 'auto';
    promptInput.style.height = `${Math.min(promptInput.scrollHeight, 120)}px`;
}

function addUserMessage(text) {
    const message = document.querySelector('#userTemplate').cloneNode(true);
    message.removeAttribute('id');
    message.classList.remove('hidden');
    message.querySelector('.user-text').textContent = text;
    messages.appendChild(message);
}

function addAssistantMessage(text, showSource = true) {
    const message = document.querySelector('#assistantTemplate').cloneNode(true);
    message.removeAttribute('id');
    message.classList.remove('hidden');
    message.querySelector('.assistant-text').textContent = text;
    if (showSource) message.querySelector('.source-line').classList.remove('hidden');
    messages.appendChild(message);
}

async function askModel(question) {
    const trimmed = question.trim();
    if (!trimmed || sendButton.disabled) return;

    emptyState.classList.add('hidden');
    addUserMessage(trimmed);
    promptInput.value = '';
    resizeInput();
    sendButton.disabled = true;
    sendButton.textContent = '…';

    try {
        const response = await fetch(`${API_BASE_URL}/api/gemini/${encodeURIComponent(trimmed)}`);
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        const answer = await response.text();
        addAssistantMessage(answer || 'The model returned an empty response.');
    } catch (error) {
        addAssistantMessage('The model could not be reached. try again.', false);
        showToast('Backend is not connected');
    } finally {
        sendButton.disabled = false;
        sendButton.textContent = '↗';
        messages.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    askModel(promptInput.value);
});

promptInput.addEventListener('input', resizeInput);
promptInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        askModel(promptInput.value);
    }
});

fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files || []);
    if (!files.length) return;
    fileStatus.textContent = `${files.length} document${files.length === 1 ? '' : 's'} selected`;
    showToast('Document selected for context');
});

document.querySelector('#newChat').addEventListener('click', () => {
    messages.querySelectorAll('.message:not([id])').forEach((message) => message.remove());
    emptyState.classList.remove('hidden');
    promptInput.value = '';
    fileInput.value = '';
    fileStatus.textContent = 'Upload a document or image';
    resizeInput();
});

resizeInput();
