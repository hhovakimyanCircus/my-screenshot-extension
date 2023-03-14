const onDocumentClick = function (event) {
    if (!chrome.runtime?.id) {
        return;
    }

    chrome.runtime.sendMessage({
        event: "CLICK_ON_PAGE",
        data: {
            elementName: event.target.innerText
        }
    });
}

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.stopRecording) {
        document.getElementsByTagName('body')[0].removeEventListener('click', onDocumentClick);
    } else if (message.startRecording) {
        document.getElementsByTagName('body')[0].addEventListener('click', onDocumentClick);
    }
});