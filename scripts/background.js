chrome.runtime.onMessage.addListener((message, sender) => {
    if (sender.tab && message.event === "CLICK_ON_PAGE") {
        chrome.desktopCapture.chooseDesktopMedia(["screen"], sender.tab, (streamId) => {
            if (streamId && streamId.length) {
                chrome.tabs.sendMessage(sender.tab.id, {streamId, success: true});
            }
        })
    }
});