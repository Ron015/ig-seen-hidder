(function () {
    'use strict';

    let isEnabled = true;

    // Listen for messages from the content script (inject.js)
    window.addEventListener('message', (event) => {
        // Only accept messages from the same window
        if (event.source !== window) return;
        
        if (event.data.type === 'INIT_HIDER_STATE' || event.data.type === 'UPDATE_HIDER_STATE') {
            isEnabled = event.data.enabled;
        }
    });

    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        this._method = method;
        this._url = url;
        originalOpen.apply(this, arguments);
    };

    const originalSend = XMLHttpRequest.prototype.send;

    Object.defineProperty(XMLHttpRequest.prototype, 'send', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function(body) {
            if (!isEnabled) {
                originalSend.apply(this, arguments);
                return;
            }
            
            // Handle FormData or URLSearchParams
            let variables = null;
            
            if (body instanceof URLSearchParams) {
                variables = body.get('variables');
            } else if (typeof body === 'string') {
                try {
                    const decoded = new URLSearchParams(body);
                    variables = decoded.get('variables');
                } catch (e) {
                    // Not URL encoded
                }
            }
            
            let block = false;

            if (variables) {
                try {
                    const parsed = JSON.parse(variables);
                    if (parsed?.metadata?.ig_thread_igid) {
                        block = true;
                    }
                } catch (e) {
                    // Invalid JSON
                }
            }

            if (this._url && this._url.includes('graphql') && block) {
                // Block the seen receipt
                this.abort();
            } else {
                originalSend.apply(this, arguments);
            }
        }
    });
})();