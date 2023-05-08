(() => {
    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("keyup", (event) => {
        if (["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(event.key))
            handleSelection();
    });

    function handleSelection()
    {
        let selectedText = window.getSelection().toString();
        if (selectedText.length > 0)
        {
            // Send message to background script to request simplifying
            chrome.runtime.sendMessage({
                type: "latex-director-bg-simplify-request",
                params: {
                    selectedText: selectedText
                }
            });
        }
    }
})();