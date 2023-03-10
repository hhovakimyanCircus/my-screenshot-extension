const onDocumentClick = function (event) {
    const elementInnerText = event.target.innerText;
    chrome.runtime.sendMessage({
        event : "CLICK_ON_PAGE",
        data : {
            elementName: elementInnerText
        }
    });
}

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.stopRecording) {
        document.getElementsByTagName('body')[0].removeEventListener('click', onDocumentClick);
    } else if (message.startRecording) {
        document.getElementsByTagName('body')[0].addEventListener('click', onDocumentClick);
    } else if (message.image) {
        console.log(message.image);
    }
});