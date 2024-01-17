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

    if (['stopRecordingBtn', 'stopRecordingBtnWhiteDot'].includes(event.target.id)) {
        return;
    }

    document.getElementById('stopRecordingBtn').style.display = 'none';

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
    document.body.addEventListener(
      'mousedown',
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
    document.getElementById('stopRecordingBtn').remove();

    const storageData = await chrome.storage.local.get(["sessionId", "user", "recordingStartTime"]);

    chrome.runtime.sendMessage({
        event: "STOP_RECORDING",
        sessionId: storageData?.sessionId,
        userId: storageData?.user?.id,
        refreshToken: storageData?.user?.refreshToken,
        data: {
            recordingTime: Date.now() - storageData.recordingStartTime,
            userName: storageData?.user.name.split(' ')[0] || '',
        }
    });

    chrome.storage.local.set({ recordingStartTime: null, sessionId: null, idToken: null, recording: false });
}

const addStopRecordingButtonToScreen = () => {
    const button = document.createElement('button');
    button.setAttribute('id', 'stopRecordingBtn');
    button.setAttribute('style', convertCssStylesToText(stopRecordingButtonStyles));
    button.addEventListener('click', stopRecordingFromScreen);

    const whiteDot = document.createElement('div');
    whiteDot.setAttribute('id', 'stopRecordingBtnWhiteDot');
    whiteDot.setAttribute('style', convertCssStylesToText(whiteDotStyles));
    whiteDot.addEventListener('click', stopRecordingFromScreen);

    button.appendChild(whiteDot);

    document.body.appendChild(button);
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

window.addEventListener('MY_SCREENSHOTER_START_RECORDING', () => {
    chrome.runtime.sendMessage({
        type: 'webEventCaptured',
        event: 'MY_SCREENSHOTER_START_RECORDING',
        sessionId: generateUniqueSessionId()
    });
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
                userName: message.data?.userName.split(' ')[0] || '',
            }
        });

        document.getElementsByTagName('body')[0].removeEventListener('click', onDocumentClick);
        document.getElementById('stopRecordingBtn').remove();
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
            const radius = 29;

            context.beginPath();
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            context.fillStyle = 'rgba(255, 236, 89, 0.6)';
            context.fill();
            context.strokeStyle = 'rgb(255, 236, 89)';
            context.lineWidth = 2;
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
                document.getElementById('stopRecordingBtn').style.display = 'flex';
            })
        }
    } else if (message.event === 'URL_CHANGE') {
        chrome.storage.local.get((result) => {
            const elem = document.getElementById('stopRecordingBtn');

            if (result.recording && !elem) {
                addStopRecordingButtonToScreen();
                listenToPageClicks(result.sessionId, result.user.id, result.user.refreshToken)
            }
        })
    }
});