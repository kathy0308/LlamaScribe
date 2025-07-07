let typingTimer;
const doneTypingInterval = 1500;
let activeElement = null;

// Listen for when a user clicks into a text field.
document.addEventListener('focusin', (e) => {
    if (e.target.matches('textarea, input[type="text"], [contenteditable="true"]')) {
        activeElement = e.target;
        activeElement.addEventListener('keyup', handleKeyUp);
    }
});

// Stop listening when the user clicks out of the text field.
document.addEventListener('focusout', (e) => {
    if (activeElement) {
        activeElement.removeEventListener('keyup', handleKeyUp);
        clearTimeout(typingTimer);
        activeElement = null;
    }
});

// When the user stops typing, get recommendations.
function handleKeyUp() {
    clearTimeout(typingTimer);
    const text = getActiveElementText();
    if (text && text.trim().length > 20) {
        typingTimer = setTimeout(() => {
            chrome.runtime.sendMessage({ type: 'GET_RECOMMENDATIONS', text: text });
        }, doneTypingInterval);
    }
}

// Helper to get text from either a standard input or a complex editor.
function getActiveElementText() {
    if (!activeElement) return '';
    return activeElement.isContentEditable ? activeElement.innerText : activeElement.value;
}

// Listen for the 'paste' command from the side panel.
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'INSERT_TEXT' && activeElement) {
        const currentText = getActiveElementText();
        const separator = currentText.endsWith(' ') || currentText.length === 0 ? '' : ' ';
        const textToInsert = separator + message.text;

        if (activeElement.isContentEditable) {
            // This is the most reliable way to insert into complex editors like Google Docs.
            document.execCommand('insertText', false, textToInsert);
        } else {
            activeElement.value += textToInsert;
        }
        activeElement.focus();
    }
});
