let typingTimer;
const doneTypingInterval = 1500;

document.addEventListener('focusin', (e) => {
    if (e.target.matches('textarea, input[type="text"], [contenteditable="true"]')) {
        e.target.addEventListener('keyup', handleKeyUp);
    }
});

document.addEventListener('focusout', (e) => {
    if (e.target.matches('textarea, input[type="text"], [contenteditable="true"]')) {
        e.target.removeEventListener('keyup', handleKeyUp);
        clearTimeout(typingTimer);
    }
});

function handleKeyUp(e) {
    clearTimeout(typingTimer);
    const target = e.target;
    const text = target.isContentEditable ? target.innerText : target.value;

    if (text && text.trim().length > 20) {
        typingTimer = setTimeout(() => {
            chrome.runtime.sendMessage({ type: 'GET_RECOMMENDATIONS', text: text });
        }, doneTypingInterval);
    }
}
