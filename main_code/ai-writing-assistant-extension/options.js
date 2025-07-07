const apiKeyInput = document.getElementById('api-key');
const contextContentInput = document.getElementById('context-content');
const saveBtn = document.getElementById('save-btn');
const statusEl = document.getElementById('status');

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['apiKey', 'contextContent'], (result) => {
        if (result.apiKey) apiKeyInput.value = result.apiKey;
        if (result.contextContent) contextContentInput.value = result.contextContent;
    });
});

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
