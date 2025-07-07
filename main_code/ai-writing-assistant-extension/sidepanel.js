const recommendationsContainer = document.getElementById('recommendations-container');
const placeholder = document.getElementById('placeholder');

// Open options page when settings button is clicked
document.getElementById('options-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SHOW_RECOMMENDATIONS') {
        displayRecommendations(message.data);
    } else if (message.type === 'SHOW_ERROR') {
        displayError(message.error);
    }
});

function displayRecommendations(suggestions) {
    recommendationsContainer.innerHTML = ''; // Clear previous content
    if (!suggestions || suggestions.length === 0) {
        displayError('No suggestions found.');
        return;
    }

    suggestions.forEach(suggestion => {
        const card = document.createElement('button');
        card.textContent = suggestion;
        card.className = 'recommendation-card w-full text-left p-3 bg-slate-100 rounded-lg hover:bg-indigo-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500';

        card.onclick = () => {
            // Tell the content script to insert the text
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'INSERT_TEXT', text: suggestion });
            });
        };
        recommendationsContainer.appendChild(card);
    });
}

function displayError(message) {
    recommendationsContainer.innerHTML = `
        <div class="text-center text-red-600 py-8 px-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p class="mt-2 text-sm font-semibold">Error</p>
            <p class="mt-1 text-sm">${message}</p>
        </div>
    `;
}
