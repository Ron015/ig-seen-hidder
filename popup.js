document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('hiderToggle');
    const statusMessage = document.getElementById('statusMessage');
    const statusIndicator = document.getElementById('statusIndicator');

    // Load saved state
    chrome.storage.local.get(['hiderEnabled'], (result) => {
        const isEnabled = result.hiderEnabled !== false;
        toggle.checked = isEnabled;
        updateUI(isEnabled);
    });

    // Handle toggle changes
    toggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        
        chrome.storage.local.set({ hiderEnabled: isEnabled }, () => {
            updateUI(isEnabled);
            
            // Notify all Instagram tabs using multiple methods
            chrome.tabs.query({ url: '*://*.instagram.com/*' }, (tabs) => {
                tabs.forEach(tab => {
                    // Method 1: Direct message to content script
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'UPDATE_HIDER_STATE',
                        enabled: isEnabled
                    }).catch(() => {
                        // Method 2: If direct message fails, storage change will handle it
                        console.log('Tab not ready for direct message, using storage sync');
                    });
                });
            });
        });
    });

    function updateUI(enabled) {
        if (enabled) {
            statusMessage.textContent = '✨ Seen receipts are hidden';
            statusMessage.classList.remove('disabled');
            statusIndicator.classList.remove('disabled');
        } else {
            statusMessage.textContent = '👁️ Seen receipts are visible';
            statusMessage.classList.add('disabled');
            statusIndicator.classList.add('disabled');
        }
    }
});