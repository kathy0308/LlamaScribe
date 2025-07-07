const apiKeyInput = document.getElementById('api-key');
const contextContentInput = document.getElementById('context-content');
const saveBtn = document.getElementById('save-btn');
const statusEl = document.getElementById('status');

// Load saved settings when the page loads
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['apiKey', 'contextContent'], (result) => {
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }
        if (result.contextContent) {
            contextContentInput.value = result.contextContent;
        }
    });
});

// Save settings when the save button is clicked
saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    const contextContent = contextContentInput.value.trim();

    if (!apiKey) {
        statusEl.textContent = 'Please enter an API key.';
        statusEl.style.color = 'red';
        return;
    }

    chrome.storage.sync.set({ apiKey, contextContent }, () => {
        statusEl.textContent = 'Settings saved!';
        statusEl.style.color = 'green';
        setTimeout(() => {
            statusEl.textContent = '';
        }, 2000);
    });
});
