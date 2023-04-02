const onDocumentClick = function (event, sessionId, userId, refreshToken) {
    if (!chrome.runtime?.id) {
        return;
    }

    chrome.runtime.sendMessage({
        event: "CLICK_ON_PAGE",
        sessionId: sessionId,
        userId: userId,
        refreshToken: refreshToken,
        data: {
            elementName: event.target.innerText,
        }
    });
}

window.addEventListener('MY_SCREENSHOTER_LOGIN', (event) => {
    chrome.storage.local.set({ user: {id: event.detail.userId, refreshToken: event.detail.refreshToken} });
});

window.addEventListener('MY_SCREENSHOTER_LOGOUT', () => {
    chrome.storage.local.set({ user: null });
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.stopRecording) {
        chrome.runtime.sendMessage({
            event: "STOP_RECORDING",
            sessionId: message.data.sessionId,
            userId: message.data.userId,
            refreshToken: message.data.refreshToken,
            data: {
                recordingTime: Date.now() - message.data.recordingStartTime,
            }
        });

        document.getElementsByTagName('body')[0].removeEventListener('click', onDocumentClick);
    } else if (message.startRecording) {
        document.getElementsByTagName('body')[0]
            .addEventListener(
            'click',
            (event) => {
                    onDocumentClick(event, message.sessionId, message.userId, message.refreshToken)
                }
            );
    }
});