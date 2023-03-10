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
    if (message?.streamId) {
        let track, canvas
        navigator.mediaDevices.getUserMedia({
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: message.streamId
                },
            }
        }).then((stream) => {
            track = stream.getVideoTracks()[0];
            const imageCapture = new ImageCapture(track);
            return imageCapture.grabFrame();
        }).then((bitmap) => {
            track.stop();
            canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            let context = canvas.getContext('2d');
            context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);

            return canvas.toDataURL();
        }).then((url) => {
            console.log('Screenshot taken');
        }).catch((err) => {
            console.error(err);
        })
    } else if (message.stopRecording) {
        document.getElementsByTagName('body')[0].removeEventListener('click', onDocumentClick);
    } else if (message.startRecording) {
        document.getElementsByTagName('body')[0].addEventListener('click', onDocumentClick);
    }
});