const firebaseConfig = {
    apiKey: "AIzaSyBTVcYHhjfq3QCa0kAqsV7b8q4NfLQiXho",
    databaseURL: "https://screenshoter-dfcd1-default-rtdb.firebaseio.com",
};

const insertRecordingStepsIntoDb = async (userId, recordingId, idToken, data) => {
    fetch(`${firebaseConfig.databaseURL}/users/${userId}/${recordingId}/steps.json?auth=${idToken}`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .catch((error) => { console.error(error) })
}

const onDocumentClick = function (event, sessionId, userId, refreshToken) {
    if (!chrome.runtime?.id) {
        return;
    }

    if (['myScreenshotStopRecordingWrapper', 'stopRecordingBtn'].includes(event.target.id)) {
        return;
    }

    document.getElementById('myScreenshotStopRecordingWrapper').style.display = 'none';

    setTimeout(() => {
        chrome.runtime.sendMessage({
            event: "CLICK_ON_PAGE",
            sessionId: sessionId,
            userId: userId,
            refreshToken: refreshToken,
            data: {
                elementName: event.target.innerText,
            },
            eventData: {
                clientX: event.clientX,
                clientY: event.clientY,
            }
        });
    }, 100)
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
        const canvas = document.createElement('canvas');
        canvas.setAttribute('width', `${window.innerWidth}px`);
        canvas.setAttribute('height', `${window.innerHeight}px`);
        canvas.setAttribute('style', `height: ${window.innerHeight}px; width: ${window.innerWidth}px;`);
        document.body.appendChild(canvas);

        const context = canvas.getContext('2d');
        const image = new Image();
        image.src = message.image;

        image.onload = function () {
            context.drawImage(image, 0,0, window.innerWidth, window.innerHeight);

            const centerX = message.eventData.clientX;
            const centerY = message.eventData.clientY;
            const radius = 20;

            context.beginPath();
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            context.fillStyle = 'rgba(252, 104, 188, 0.7)';
            context.fill();
            context.stroke();

            const base64image = canvas.toDataURL('image/png');


            insertRecordingStepsIntoDb(
              message.userId,
              message.sessionId,
              message.idToken,
              {
                  clickedElementName: message.clickedElementName,
                  image: base64image,
                  url: message.sender.tab.url,
                  website: message.sender.tab.url.split('/')[2],
                  setupId: message.extensionId,
                  timestamp: Date.now(),
              }
            ).finally(() => {
                canvas.remove();
                image.remove();
                document.getElementById('myScreenshotStopRecordingWrapper').style.display = 'flex';
            })
        }
    }
});