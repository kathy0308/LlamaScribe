const recommendationsContainer = document.getElementById('recommendations-container');

document.getElementById('options-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SHOW_LOADING') {
        showLoading();
    } else if (message.type === 'SHOW_RECOMMENDATIONS') {
        displayRecommendations(message.data);
    } else if (message.type === 'SHOW_ERROR') {
        displayError(message.error);
    }
});

function showLoading() {
    recommendationsContainer.innerHTML = `
        <div class="text-center text-slate-500 py-8 px-2 animate-pulse">
            <p class="text-sm">Generating ideas...</p>
        </div>
    `;
}

function displayRecommendations(suggestions) {
    recommendationsContainer.innerHTML = '';
    if (!suggestions || suggestions.length === 0) {
        displayError('No suggestions found.');
        return;
    }
    suggestions.forEach(suggestion => {
        const card = document.createElement('button');
        card.textContent = suggestion;
        card.className = 'w-full text-left p-3 bg-slate-100 rounded-lg hover:bg-indigo-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500';
        card.onclick = () => {
            chrome.runtime.sendMessage({ type: 'INSERT_TEXT', text: suggestion });
        };
        recommendationsContainer.appendChild(card);
    });
}

function displayError(message) {
    recommendationsContainer.innerHTML = `
        <div class="text-center text-red-600 py-8 px-2">
            <p class="mt-1 text-sm">${message}</p>
        </div>
    `;
}
