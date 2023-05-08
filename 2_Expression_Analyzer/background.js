chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const {type, params} = obj;

    // Receives message from parser to open box
    if (type == "latex-director-bg-open-box")
    {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            var tabId = tabs[0].id;
            
            // Send a message to box script to open box
            chrome.tabs.sendMessage(tabId, {
                type: "latex-director-open-box",
                params: {
                    simplifiedFormula: params.simplifiedFormula
                }
            })
        });
    }

    else if (type == "latex-director-bg-simplify-request")
    {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            var tabId = tabs[0].id;
            
            // Send a message to box script to open box
            chrome.tabs.sendMessage(tabId, {
                type: "latex-director-simplify-request",
                params: {
                    selectedText: params.selectedText
                }
            })
        });
    }
})
