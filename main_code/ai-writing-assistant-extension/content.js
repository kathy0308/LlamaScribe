let typingTimer;
const doneTypingInterval = 1500;
let lastActiveElement = null; // Use a new variable to always remember the last text box.

// Listen for when a user clicks into a text field.
document.addEventListener('focusin', (e) => {
    if (e.target.matches('textarea, input[type="text"], [contenteditable="true"]')) {
        lastActiveElement = e.target; // Remember this element.
        lastActiveElement.addEventListener('keyup', handleKeyUp);
    }
});

// When the user stops typing, get recommendations.
function handleKeyUp(e) {
    clearTimeout(typingTimer);
    const text = getActiveElementText();
    if (text && text.trim().length > 20) {
        typingTimer = setTimeout(() => {
            chrome.runtime.sendMessage({ type: 'GET_RECOMMENDATIONS', text: text });
        }, doneTypingInterval);
    }
}

// Helper to get text from the last active element.
function getActiveElementText() {
    if (!lastActiveElement) return '';
    return lastActiveElement.isContentEditable ? lastActiveElement.innerText : lastActiveElement.value;
}

// Listen for the 'paste' command from the side panel.
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'INSERT_TEXT' && lastActiveElement) {
        const currentText = getActiveElementText();
        const separator = currentText.endsWith(' ') || currentText.length === 0 ? '' : ' ';
        const textToInsert = separator + message.text;

        if (lastActiveElement.isContentEditable) {
            // This is the most reliable way to insert into complex editors.
            document.execCommand('insertText', false, textToInsert);
        } else {
            lastActiveElement.value += textToInsert;
        }
        lastActiveElement.focus();
    }
});
