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

const convertCssStylesToText = (styles) => {
    return Object.keys(styles)
        .reduce(
            (accumulator, currentValue) => accumulator + `${currentValue}:${styles[currentValue]};`,
            ''
        )
        .slice(0, -1);
}

const addOverlayToScreen = () => {
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
        overlayWindow.remove()
    }, 3000)
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
        addOverlayToScreen();

        document.getElementsByTagName('body')[0]
            .addEventListener(
            'click',
            (event) => {
                    onDocumentClick(event, message.sessionId, message.userId, message.refreshToken)
                }
            );
    }
});