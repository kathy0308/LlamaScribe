const apiKeyInput = document.getElementById('api-key');
const saveBtn = document.getElementById('save-btn');
const statusEl = document.getElementById('status');

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['apiKey'], (result) => {
        if (result.apiKey) apiKeyInput.value = result.apiKey;
    });
});

saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        statusEl.textContent = 'Please enter an API key.';
        statusEl.style.color = 'red';
        return;
    }
    chrome.storage.sync.set({ apiKey: apiKey }, () => {
        statusEl.textContent = 'API Key saved!';
        statusEl.style.color = 'green';
        setTimeout(() => { statusEl.textContent = ''; }, 2000);
    });
});
