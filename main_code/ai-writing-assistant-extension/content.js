let typingTimer;
const doneTypingInterval = 1000; // Time in milliseconds to wait after user stops typing.

console.log('AI Assistant (Content Script): Loaded and running.');

// Listen for keyup events anywhere on the page.
document.addEventListener('keyup', (e) => {
    // Check if the event happened inside a valid text input area.
    if (e.target.matches('textarea, input[type="text"], [contenteditable="true"]')) {
        const target = e.target;
        const text = target.isContentEditable ? target.innerText : target.value;

        // Reset the timer every time a key is pressed.
        clearTimeout(typingTimer);

        // If there's enough text, set a timer to get recommendations.
        if (text && text.trim().length > 20) {
            typingTimer = setTimeout(() => {
                console.log('AI Assistant (Content Script): Timer finished. Sending text to background:', text);
                // Send the text to the background script to get recommendations.
                chrome.runtime.sendMessage({ type: 'GET_RECOMMENDATIONS', text: text });
            }, doneTypingInterval);
        }
    }
});
