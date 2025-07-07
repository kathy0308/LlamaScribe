let typingTimer;
const doneTypingInterval = 1500;
let lastActiveElement = null;

document.addEventListener('focusin', (e) => {
    if (e.target.matches('textarea, input[type="text"], [contenteditable="true"]')) {
        lastActiveElement = e.target;
        lastActiveElement.addEventListener('keyup', handleKeyUp);
    }
});

function handleKeyUp(e) {
    clearTimeout(typingTimer);
    const text = getActiveElementText();
    if (text && text.trim().length > 20) {
        typingTimer = setTimeout(() => {
            chrome.runtime.sendMessage({ type: 'GET_RECOMMENDATIONS', text: text });
        }, doneTypingInterval);
    }
}

function getActiveElementText() {
    if (!lastActiveElement) return '';
    return lastActiveElement.isContentEditable ? lastActiveElement.innerText : lastActiveElement.value;
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'INSERT_TEXT' && lastActiveElement) {
        const currentText = getActiveElementText();
        const separator = currentText.endsWith(' ') || currentText.length === 0 ? '' : ' ';
        const textToInsert = separator + message.text;

        if (lastActiveElement.isContentEditable) {
            document.execCommand('insertText', false, textToInsert);
        } else {
            lastActiveElement.value += textToInsert;
        }
        lastActiveElement.focus();
    }
});
