chrome.runtime.onMessage.addListener((message, sender) => {
    if (sender.tab && message.event === "CLICK_ON_PAGE") {
        chrome.tabs.captureVisibleTab(null, {}, function (image) {
            chrome.tabs.sendMessage(sender.tab.id, {image, success: true});
        });
    }
});