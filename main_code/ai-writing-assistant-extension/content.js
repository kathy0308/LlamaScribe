let typingTimer;
const doneTypingInterval = 1500; // 1.5 seconds
let activeElement = null;

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
    }
});

function handleKeyUp() {
    clearTimeout(typingTimer);
    if (getElementText().trim().length > 20) {
        typingTimer = setTimeout(triggerGetRecommendations, doneTypingInterval);
    }
}

function handleKeyDown() {
    clearTimeout(typingTimer);
}

function triggerGetRecommendations() {
    if (!activeElement) return;
    const userText = getElementText();

    // Tell background script to open the panel and get recommendations
    chrome.runtime.sendMessage({ type: 'open_side_panel' });
    chrome.runtime.sendMessage({ type: 'GET_RECOMMENDATIONS', text: userText });
}

function getElementText() {
    if (!activeElement) return '';
    return activeElement.isContentEditable ? activeElement.innerText : active.value;
}

// Listen for a message from the side panel to insert text
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INSERT_TEXT') {
        if (activeElement) {
            const currentText = getElementText();
            const separator = currentText.endsWith(' ') || currentText.length === 0 ? '' : ' ';
            const textToInsert = separator + message.text;

            if (activeElement.isContentEditable) {
                document.execCommand('insertText', false, textToInsert);
            } else {
                activeElement.value += textToInsert;
            }
            activeElement.focus();
        }
    }
});
