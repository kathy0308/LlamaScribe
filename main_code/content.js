// --- STATE & CONFIGURATION ---
let typingTimer;
const doneTypingInterval = 1500; // 1.5 seconds
let activeElement = null;
let recommendationsPanel; // Will be created on demand

// --- EVENT LISTENERS ---

document.addEventListener('focusin', (e) => {
    if (e.target.matches('textarea, input[type="text"], [contenteditable="true"]')) {
        activeElement = e.target;
        activeElement.addEventListener('keyup', handleKeyUp);
        activeElement.addEventListener('keydown', handleKeyDown);
    }
});

document.addEventListener('focusout', (e) => {
    if (activeElement) {
        activeElement.removeEventListener('keyup', handleKeyUp);
        activeElement.removeEventListener('keydown', handleKeyDown);
        clearTimeout(typingTimer);
        activeElement = null;
        hideRecommendations();
    }
});

function handleKeyUp() {
    clearTimeout(typingTimer);
    if (getElementText(activeElement).trim().length > 20) {
        typingTimer = setTimeout(triggerGetRecommendations, doneTypingInterval);
    }
}

function handleKeyDown() {
    clearTimeout(typingTimer);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SHOW_RECOMMENDATIONS') {
        displayRecommendations(message.data);
    } else if (message.type === 'SHOW_ERROR') {
        displayError(message.error);
    }
});

// --- CORE LOGIC ---

function triggerGetRecommendations() {
    if (!activeElement) return;

    const userText = getElementText(activeElement);
    if (userText.trim().length < 20) return;

    if (!recommendationsPanel) {
        recommendationsPanel = createRecommendationsPanel();
    }

    positionPanel(activeElement);
    showLoading();

    // Send the text to the background script to handle the API call
    chrome.runtime.sendMessage({ type: 'GET_RECOMMENDATIONS', text: userText });
}

// --- UI & HELPERS ---

function createRecommendationsPanel() {
    const panel = document.createElement('div');
    panel.id = 'ai-writing-assistant-panel';
    document.body.appendChild(panel);
    return panel;
}

function positionPanel(element) {
    const rect = element.getBoundingClientRect();
    recommendationsPanel.style.top = `${window.scrollY + rect.bottom + 5}px`;
    recommendationsPanel.style.left = `${window.scrollX + rect.left}px`;
    recommendationsPanel.style.display = 'block';
}

function hideRecommendations() {
    if (recommendationsPanel) {
        recommendationsPanel.style.display = 'none';
    }
}

function showLoading() {
    recommendationsPanel.innerHTML = '<div class="ai-assistant-loader">Generating ideas...</div>';
}

function displayError(message) {
    recommendationsPanel.innerHTML = `<div class="ai-assistant-error">${message}</div>`;
}

function displayRecommendations(suggestions) {
    recommendationsPanel.innerHTML = '';
    if (!suggestions || suggestions.length === 0) {
        displayError('No suggestions found.');
        return;
    }

    suggestions.forEach(suggestion => {
        const card = document.createElement('button');
        card.textContent = suggestion;
        card.className = 'ai-assistant-card';
        card.onclick = () => {
            insertText(suggestion);
            hideRecommendations();
        };
        recommendationsPanel.appendChild(card);
    });
}

function getElementText(element) {
    if (!element) return '';
    return element.isContentEditable ? element.innerText : element.value;
}

function insertText(text) {
    if (!activeElement) return;
    const currentText = getElementText(activeElement);
    const separator = currentText.endsWith(' ') || currentText.length === 0 ? '' : ' ';

    if (activeElement.isContentEditable) {
        document.execCommand('insertText', false, separator + text);
    } else {
        activeElement.value += separator + text;
    }
    activeElement.focus();
}
