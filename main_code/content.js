// --- STATE & CONFIGURATION ---
let typingTimer;
const doneTypingInterval = 1500; // 1.5 seconds
let activeElement = null;
let contextContent = ''; // In a real extension, this might be loaded from storage

// --- UI CREATION ---

/**
 * Creates and injects the recommendations panel into the page.
 * It's created once and then shown/hidden as needed.
 */
function createRecommendationsPanel() {
    const panel = document.createElement('div');
    panel.id = 'ai-writing-assistant-panel';
    panel.style.position = 'absolute';
    panel.style.zIndex = '10000';
    panel.style.width = '300px';
    panel.style.backgroundColor = 'white';
    panel.style.border = '1px solid #e2e8f0';
    panel.style.borderRadius = '8px';
    panel.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    panel.style.padding = '12px';
    panel.style.display = 'none'; // Initially hidden
    panel.style.fontFamily = 'sans-serif';
    panel.style.fontSize = '14px';
    document.body.appendChild(panel);
    return panel;
}

const recommendationsPanel = createRecommendationsPanel();

// --- EVENT LISTENERS ---

// Listen for focus on any input or editable element
document.addEventListener('focusin', (e) => {
    if (e.target.matches('textarea, input[type="text"], [contenteditable="true"]')) {
        activeElement = e.target;
        // Attach keyup/keydown listeners only when an element is focused
        activeElement.addEventListener('keyup', handleKeyUp);
        activeElement.addEventListener('keydown', handleKeyDown);
    }
});

// Clean up listeners when focus is lost
document.addEventListener('focusout', (e) => {
    if (activeElement) {
        activeElement.removeEventListener('keyup', handleKeyUp);
        activeElement.removeEventListener('keydown', handleKeyDown);
        clearTimeout(typingTimer);
        activeElement = null;
        hideRecommendations();
    }
});

/**
 * Handles the keyup event on the active element.
 */
function handleKeyUp() {
    clearTimeout(typingTimer);
    if (getElementText(activeElement).trim().length > 20) {
        typingTimer = setTimeout(triggerGetRecommendations, doneTypingInterval);
    }
}

/**
 * Handles the keydown event to clear the timer.
 */
function handleKeyDown() {
    clearTimeout(typingTimer);
}


// --- CORE LOGIC ---

/**
 * Triggers the process of getting recommendations.
 */
function triggerGetRecommendations() {
    if (!activeElement) return;

    const userText = getElementText(activeElement);
    if (userText.trim().length < 20) return;

    positionPanel(activeElement);
    showLoading();

    // In a real extension, you'd get the API key from chrome.storage
    const apiKey = ""; // This will be handled by the environment

    getRecommendationsFromAPI(userText, contextContent, apiKey);
}

/**
 * Fetches recommendations from the Gemini API.
 * @param {string} userText - The text written by the user.
 * @param {string} contextContent - Additional context.
 * @param {string} apiKey - The API key for Gemini.
 */
async function getRecommendationsFromAPI(userText, contextContent, apiKey) {
    const prompt = `
        You are an expert writing assistant. A user is writing and needs help with the next sentence.
        Your task is to provide three distinct, creative, and contextually relevant suggestions for the next sentence.

        The user's text so far is:
        --- TEXT START ---
        ${userText}
        --- TEXT END ---

        ${contextContent ? `
        The user has also provided a context file. Use the information from this file to inform your suggestions.
        --- CONTEXT FILE START ---
        ${contextContent}
        --- CONTEXT FILE END ---
        ` : ''}

        Based on the text and context, generate three suggestions for the very next sentence.
        The suggestions should flow naturally from the last sentence of the text.
        Return your response as a valid JSON array of strings. For example: ["Suggestion 1.", "Suggestion 2.", "Suggestion 3."]
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0) {
            const rawText = result.candidates[0].content.parts[0].text;
            const jsonString = rawText.match(/\[.*\]/s)[0];
            const suggestions = JSON.parse(jsonString);
            displayRecommendations(suggestions);
        } else {
            displayError('No suggestions were generated.');
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        displayError('Sorry, an error occurred.');
    }
}


// --- UI DISPLAY & HELPERS ---

/**
 * Positions the recommendations panel near the active element.
 * @param {HTMLElement} element - The currently focused text element.
 */
function positionPanel(element) {
    const rect = element.getBoundingClientRect();
    recommendationsPanel.style.top = `${window.scrollY + rect.bottom + 5}px`;
    recommendationsPanel.style.left = `${window.scrollX + rect.left}px`;
    recommendationsPanel.style.display = 'block';
}

/**
 * Hides the recommendations panel.
 */
function hideRecommendations() {
    if (recommendationsPanel) {
        recommendationsPanel.style.display = 'none';
    }
}

/**
 * Shows a loading state in the panel.
 */
function showLoading() {
    recommendationsPanel.innerHTML = '<div style="text-align: center; color: #64748b;">Generating ideas...</div>';
}

/**
 * Displays an error message in the panel.
 * @param {string} message - The error message.
 */
function displayError(message) {
    recommendationsPanel.innerHTML = `<div style="color: #dc2626;">${message}</div>`;
}

/**
 * Displays the list of suggestions in the panel.
 * @param {string[]} suggestions - An array of sentence suggestions.
 */
function displayRecommendations(suggestions) {
    recommendationsPanel.innerHTML = ''; // Clear previous content
    if (!suggestions || suggestions.length === 0) {
        displayError('No suggestions found.');
        return;
    }

    suggestions.forEach(suggestion => {
        const card = document.createElement('button');
        card.textContent = suggestion;
        card.style.display = 'block';
        card.style.width = '100%';
        card.style.textAlign = 'left';
        card.style.padding = '8px';
        card.style.marginBottom = '4px';
        card.style.border = 'none';
        card.style.borderRadius = '4px';
        card.style.backgroundColor = '#f1f5f9';
        card.style.cursor = 'pointer';

        card.onmouseover = () => card.style.backgroundColor = '#e2e8f0';
        card.onmouseout = () => card.style.backgroundColor = '#f1f5f9';

        card.onclick = () => {
            insertText(suggestion);
            hideRecommendations();
        };

        recommendationsPanel.appendChild(card);
    });
}

/**
 * Gets the text from the active element, whether it's an input, textarea, or contenteditable div.
 * @param {HTMLElement} element - The active element.
 * @returns {string} The text content.
 */
function getElementText(element) {
    if (!element) return '';
    return element.isContentEditable ? element.innerText : element.value;
}

/**
 * Inserts the selected suggestion into the active element.
 * @param {string} text - The text to insert.
 */
function insertText(text) {
    if (!activeElement) return;
    const currentText = getElementText(activeElement);
    const separator = currentText.endsWith(' ') || currentText.length === 0 ? '' : ' ';

    if (activeElement.isContentEditable) {
        activeElement.innerText += separator + text;
    } else {
        activeElement.value += separator + text;
    }
    activeElement.focus();
}
