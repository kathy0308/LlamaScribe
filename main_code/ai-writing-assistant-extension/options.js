const apiKeyInput = document.getElementById('api-key');
const contextContentInput = document.getElementById('context-content');
const saveBtn = document.getElementById('save-btn');
const statusEl = document.getElementById('status');
const fileInput = document.getElementById('context-file-input');
const fileNameEl = document.getElementById('file-name');

// Load saved settings when the page loads
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['apiKey', 'contextContent'], (result) => {
        if (result.apiKey) apiKeyInput.value = result.apiKey;
        if (result.contextContent) contextContentInput.value = result.contextContent;
    });
});

// Listen for a file to be selected
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    if (file.type !== 'text/plain') {
        fileNameEl.textContent = 'Error: Please select a .txt file.';
        fileNameEl.style.color = 'red';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        contextContentInput.value = e.target.result;
        fileNameEl.textContent = `Loaded: ${file.name}`;
        fileNameEl.style.color = '#64748b'; // slate-500
    };
    reader.readAsText(file);
});

// Save settings when the save button is clicked
saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        statusEl.textContent = 'Please enter an API key.';
        statusEl.style.color = 'red';
        return;
    }
    chrome.storage.sync.set({ apiKey: apiKey, contextContent: contextContentInput.value.trim() }, () => {
        statusEl.textContent = 'Settings saved!';
        statusEl.style.color = 'green';
        setTimeout(() => { statusEl.textContent = ''; }, 2000);
    });
});
