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

const listenToPageClicks = (sessionId, userId, refreshToken) => {
    document.getElementsByTagName('body')[0]
        .addEventListener(
            'click',
            (event) => {
                onDocumentClick(event, sessionId, userId, refreshToken)
            }
        );
}

const convertCssStylesToText = (styles) => {
    return Object.keys(styles)
        .reduce(
            (accumulator, currentValue) => accumulator + `${currentValue}:${styles[currentValue]};`,
            ''
        )
        .slice(0, -1);
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

    const button = document.createElement('button');
    button.setAttribute('id', 'stopRecordingBtn');
    button.setAttribute('style', convertCssStylesToText(buttonStyles));
    button.innerText = 'Stop Recording';

    buttonWrapper.appendChild(button)

    document.body.appendChild(buttonWrapper);
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
        addOverlayToScreen(() => {
            listenToPageClicks(message.sessionId, message.userId, message.refreshToken);
            addStopRecordingButtonToScreen();
        });
    }
});