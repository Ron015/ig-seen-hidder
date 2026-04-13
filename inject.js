(function() {
    'use strict';
    
    let isEnabled = true;
    
    // Get initial state from storage
    chrome.storage.local.get(['hiderEnabled'], (result) => {
        isEnabled = result.hiderEnabled !== false;
        injectScript(isEnabled);
    });
    
    // Listen for changes from popup
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.hiderEnabled) {
            isEnabled = changes.hiderEnabled.newValue;
            window.postMessage({
                type: 'UPDATE_HIDER_STATE',
                enabled: isEnabled
            }, '*');
        }
    });
    
    // Listen for messages from popup (direct message)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'UPDATE_HIDER_STATE') {
            isEnabled = message.enabled;
            window.postMessage({
                type: 'UPDATE_HIDER_STATE',
                enabled: isEnabled
            }, '*');
            sendResponse({ success: true });
        }
        return true;
    });
    
    function injectScript(enabled) {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('content.js');
        script.dataset.initialEnabled = enabled;
        script.onload = function() {
            // Pass initial state to the injected script
            window.postMessage({
                type: 'INIT_HIDER_STATE',
                enabled: enabled
            }, '*');
            this.remove();
        };
        (document.head || document.documentElement).appendChild(script);
    }
    
    // Initial injection
    chrome.storage.local.get(['hiderEnabled'], (result) => {
        const enabled = result.hiderEnabled !== false;
        injectScript(enabled);
    });
})();