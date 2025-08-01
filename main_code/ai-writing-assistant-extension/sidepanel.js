const recommendationsContainer = document.getElementById('recommendations-container');
const fileInput = document.getElementById('context-file-input');
const statusMessage = document.getElementById('status-message');

document.getElementById('options-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        chrome.runtime.sendMessage({ type: 'UPDATE_CONTEXT', context: e.target.result });
    };
    reader.readAsText(file);
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SHOW_LOADING') {
        showLoading();
    } else if (message.type === 'SHOW_RECOMMENDATIONS') {
        displayRecommendations(message.data);
    } else if (message.type === 'SHOW_ERROR') {
        displayError(message.error);
    } else if (message.type === 'CONTEXT_UPDATED') {
        statusMessage.textContent = message.status;
        setTimeout(() => { statusMessage.textContent = ''; }, 3000);
    }
});

function showLoading() {
    recommendationsContainer.innerHTML = `<div class="loading"><p>Generating ideas...</p></div>`;
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
        card.className = 'card';
        card.onclick = (e) => {
            copyToClipboard(suggestion, e.currentTarget);
        };
        recommendationsContainer.appendChild(card);
    });
}

function displayError(message) {
    recommendationsContainer.innerHTML = `
        <div class="error">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            <p>${message}</p>
        </div>
    `;
}

// Helper function to copy text to the clipboard and provide user feedback.
function copyToClipboard(text, element) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = element.textContent;
        element.textContent = 'Copied!';
        element.classList.add('copied');

        setTimeout(() => {
            element.textContent = originalText;
            element.classList.remove('copied');
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        element.textContent = 'Copy Failed';
    });
}
