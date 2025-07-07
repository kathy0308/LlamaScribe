console.log('AI Assistant: background.js service worker started.');

// Create the context menu item when the extension is installed.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "get-ai-recommendations",
    title: "Get AI Recommendations",
    contexts: ["selection"] // This menu item will only appear when text is selected
  });
});

// Listen for a click on our context menu item.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "get-ai-recommendations" && info.selectionText) {
    // A new way to trigger recommendations, using selected text.
    console.log('AI Assistant (Background): Triggered by context menu with text:', info.selectionText);
    chrome.sidePanel.open({ tabId: tab.id });
    triggerGetRecommendations(info.selectionText);
  }
});


// Listen for messages from the content script (for automatic detection on simple sites).
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'open_side_panel') {
        chrome.sidePanel.open({ tabId: sender.tab.id });
    }

    if (message.type === 'GET_RECOMMENDATIONS') {
        console.log('AI Assistant (Background): Received GET_RECOMMENDATIONS with text:', message.text);
        triggerGetRecommendations(message.text);
    }
});

// Central function to get recommendations, used by both methods.
function triggerGetRecommendations(text) {
    chrome.runtime.sendMessage({ type: 'SHOW_LOADING' });

    chrome.storage.sync.get(['apiKey', 'contextContent'], async (result) => {
        const { apiKey, contextContent } = result;

        if (!apiKey) {
            console.error('AI Assistant (Background): API Key is MISSING!');
            chrome.runtime.sendMessage({ type: 'SHOW_ERROR', error: 'API Key not set. Please set it in the options.' });
            return;
        }
        console.log('AI Assistant (Background): API Key found.');

        let prompt = `
            You are an expert writing assistant. A user has provided a piece of text and needs help with the next sentence.
            Your task is to provide three distinct, creative, and contextually relevant suggestions for the sentence that should follow the provided text.
            The user's text is: "${text}"
        `;

        if (contextContent) {
            prompt += `\n\nThe user has also provided the following context. Use it to inform your suggestions:\n---CONTEXT---\n${contextContent}\n---END CONTEXT---`;
        }

        prompt += `\nBased on the text and any provided context, generate three suggestions for the very next sentence.
                   IMPORTANT: Your entire response must be ONLY a single, valid JSON array of strings, with no other text, explanations, or markdown.
                   Example: ["First suggestion.", "Second suggestion.", "A third, different idea."]
        `;

        console.log('AI Assistant (Background): Sending prompt to Gemini...');
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('AI Assistant (Background): Received response from API with status:', response.status);

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('AI Assistant (Background): API Error Body:', errorBody);
                if (response.status === 400 || response.status === 403) {
                     throw new Error('Invalid API Key. Please check your key in the options.');
                }
                throw new Error(`API returned an error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('AI Assistant (Background): Successfully parsed API response:', result);

            if (result.candidates && result.candidates.length > 0) {
                const rawText = result.candidates[0].content.parts[0].text;
                try {
                    const cleanedText = rawText.trim().replace(/^```json\n/, '').replace(/\n```$/, '');
                    const suggestions = JSON.parse(cleanedText);
                    console.log('AI Assistant (Background): Sending suggestions to side panel:', suggestions);
                    chrome.runtime.sendMessage({ type: 'SHOW_RECOMMENDATIONS', data: suggestions });
                } catch (parseError) {
                    console.error('AI Assistant (Background): Failed to parse suggestions from AI response:', rawText);
                    throw new Error("AI returned a response in an unexpected format.");
                }
            } else {
                 throw new Error("No suggestions were generated by the AI.");
            }
        } catch (error) {
            console.error('AI Assistant (Background): Full error object:', error);
            chrome.runtime.sendMessage({ type: 'SHOW_ERROR', error: error.message });
        }
    });
}


// Open side panel on action click (when user clicks the toolbar icon)
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});
