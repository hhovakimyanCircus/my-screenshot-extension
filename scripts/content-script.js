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

    const highlightNode = document.createElement('img');
    highlightNode.setAttribute('src', 'data:image/png;base64,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')
    highlightNode.setAttribute('id', 'highlight-node-image');
    highlightNode.setAttribute(
        'style',
        convertCssStylesToText(
            {position: 'absolute', 'z-index': 1000, top: `${event.clientY}px`, left: `${event.clientX}px`, display: 'block', width: '160px', height: '80px'}
        )
    )

    document.body.appendChild(highlightNode);

    setTimeout(() => {
        highlightNode.remove();
    }, 300)
}

const listenToPageClicks = (sessionId, userId, refreshToken) => {
    document.getElementsByTagName('body')[0]
        .addEventListener(
            'click',
            (event) => {
                onDocumentClick(event, sessionId, userId, refreshToken)
            }
        );
}

const addOverlayToScreen = (onRecordingStart) => {
    const overlayWindowStyles = {
        background: 'rgba(0, 0, 0, .5)',
        width: '100%',
        height: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        'z-index': 100,
        display: 'flex',
        'justify-content': 'center',
        'align-items': 'center',
    };

    const overlayWindowTextStyles = {
        color: '#fff',
        'font-size': '47px',
        'font-weight': 700,
    };

    const overlayWindow = document.createElement('div');
    overlayWindow.setAttribute('id', 'my-screenshot-overlay-window');
    overlayWindow.setAttribute('style', convertCssStylesToText(overlayWindowStyles));

    const overlayWindowText = document.createElement('span');
    overlayWindowText.innerText = "Recording is starting 👌";
    overlayWindowText.setAttribute('style', convertCssStylesToText(overlayWindowTextStyles))
    overlayWindow.appendChild(overlayWindowText);

    document.body.appendChild(overlayWindow);

    setTimeout(() => {
        overlayWindow.remove();
        onRecordingStart();
    }, 3000)
}

const stopRecordingFromScreen = async () => {
    document.getElementsByTagName('body')[0].removeEventListener('click', onDocumentClick);
    document.getElementById('myScreenshotStopRecordingWrapper').remove();

    const storageData = await chrome.storage.local.get(["sessionId", "user", "recordingStartTime"]);
    chrome.runtime.sendMessage({
        event: "STOP_RECORDING",
        sessionId: storageData?.sessionId,
        userId: storageData?.user?.id,
        refreshToken: storageData?.user?.refreshToken,
        data: {
            recordingTime: Date.now() - storageData.recordingStartTime,
        }
    });

    chrome.storage.local.set({ recordingStartTime: null, sessionId: null, idToken: null });
}

const addStopRecordingButtonToScreen = () => {
    const buttonWrapperStyles = {
        width: '225px',
        padding: '25px 0',
        'border-radius': '7px',
        'box-shadow': '0px 0px 19px 13px #00000040',
        'background-color': 'grey',
        position: 'fixed',
        bottom: '30px',
        left: '30px',
        display: 'flex',
        'justify-content': 'center',
        'z-index': 50,
    }

    const buttonStyles = {
        'background-color': '#FF5C77',
        color: '#fff',
        'font-weight': 700,
        'font-size': '18px',
        'text-align': 'center',
        'border-radius': '7px',
        cursor: 'pointer',
        padding: '7px 16px',
        outline: 'none',
        width: '166px',
        border: 0,
    }

    const buttonWrapper = document.createElement('div');
    buttonWrapper.setAttribute('style', convertCssStylesToText(buttonWrapperStyles));
    buttonWrapper.setAttribute('id', 'myScreenshotStopRecordingWrapper');

    const button = document.createElement('button');
    button.setAttribute('id', 'stopRecordingBtn');
    button.setAttribute('style', convertCssStylesToText(buttonStyles));
    button.innerText = 'Stop Recording';
    button.addEventListener('click', stopRecordingFromScreen)

    buttonWrapper.appendChild(button)

    document.body.appendChild(buttonWrapper);
}

window.addEventListener('MY_SCREENSHOTER_LOGIN', (event) => {
    chrome.storage.local.set(
        {
            user: {
                id: event.detail.userId,
                refreshToken: event.detail.refreshToken,
                name: event.detail.userName,
            }
        }
    );
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
        document.getElementById('myScreenshotStopRecordingWrapper').remove();
    } else if (message.startRecording) {
        if (message.tabChange) {
            listenToPageClicks(message.sessionId, message.userId, message.refreshToken);
            addStopRecordingButtonToScreen();
        } else {
            addOverlayToScreen(() => {
                listenToPageClicks(message.sessionId, message.userId, message.refreshToken);
                addStopRecordingButtonToScreen();
            });
        }
    }
});