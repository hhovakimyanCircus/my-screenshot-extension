const onDocumentClick = function (event, sessionId, userId, refreshToken) {
    if (!chrome.runtime?.id) {
        return;
    }

    if (['myScreenshotStopRecordingWrapper', 'stopRecordingBtn'].includes(event.target.id)) {
        return;
    }

    document.getElementById('myScreenshotStopRecordingWrapper').style.display = 'none';

    const highlightNode = document.createElement('img');
    highlightNode.setAttribute('src', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzEiIGhlaWdodD0iMzEiIHZpZXdCb3g9IjAgMCAzMSAzMSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUuNSIgY3k9IjE1LjUiIHI9IjE0LjUiIGZpbGw9IiNGRkVDNTkiIGZpbGwtb3BhY2l0eT0iMC42IiBzdHJva2U9IiNGRkVDNTkiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K')
    highlightNode.setAttribute('id', 'highlight-node-image');
    highlightNode.setAttribute(
        'style',
        convertCssStylesToText(
            {
                ...highlightNodeStyles,
                top: `${event.clientY}px`,
                left: `${event.clientX}px`
            }
        )
    )

    document.body.appendChild(highlightNode);

    setTimeout(() => {
        chrome.runtime.sendMessage({
            event: "CLICK_ON_PAGE",
            sessionId: sessionId,
            userId: userId,
            refreshToken: refreshToken,
            data: {
                elementName: event.target.innerText,
            }
        });
    }, 100)

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
    const overlayWindow = document.createElement('div');
    overlayWindow.setAttribute('id', 'my-screenshot-overlay-window');
    overlayWindow.setAttribute('style', convertCssStylesToText(overlayStyles));

    const overlayWindowText = document.createElement('span');
    overlayWindowText.innerText = "Recording is starting 👌";
    overlayWindowText.setAttribute('style', convertCssStylesToText(overlayTextStyles))
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
    const buttonWrapper = document.createElement('div');
    buttonWrapper.setAttribute('style', convertCssStylesToText(stopRecordingButtonWrapperStyles));
    buttonWrapper.setAttribute('id', 'myScreenshotStopRecordingWrapper');

    const button = document.createElement('button');
    button.setAttribute('id', 'stopRecordingBtn');
    button.setAttribute('style', convertCssStylesToText(stopRecordingButtonStyles));
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
    } else if (message.event === 'TAB_CAPTURED') {
        document.getElementById('myScreenshotStopRecordingWrapper').style.display = 'flex';
    }
});