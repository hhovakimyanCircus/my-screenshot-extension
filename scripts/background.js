const firebaseConfig = {
    apiKey: "AIzaSyBTVcYHhjfq3QCa0kAqsV7b8q4NfLQiXho",
    databaseURL: "https://screenshoter-dfcd1-default-rtdb.firebaseio.com",
};

let idToken;

const refreshIdToken = async (refreshToken) => {
    const data = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    };

    let requestBody = [];
    let encodedKey, encodedValue;
    for (let property in data) {
        encodedKey = encodeURIComponent(property);
        encodedValue = encodeURIComponent(data[property]);
        requestBody.push(encodedKey + "=" + encodedValue);
    }
    requestBody = requestBody.join("&");

    try {
        const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${firebaseConfig.apiKey}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: requestBody,
        });

        const responseData = await response.json();

        return responseData.id_token;
    } catch (error) {
        return null;
    }
}

const insertRecordingStepsIntoDb = async (refreshToken, userId, recordingId, data) => {
    if (!idToken) {
        idToken = await refreshIdToken(refreshToken);
    }

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

const insertRecordingTimeIntoDb = async (userId, recordingId, refreshToken, recordingTimeSeconds) => {
    if (!idToken) {
        idToken = await refreshIdToken(refreshToken);
    }

    fetch(
        `${firebaseConfig.databaseURL}/users/${userId}/${recordingId}/details/.json?auth=${idToken}`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recordingTime: recordingTimeSeconds,
            }),
        }
    )
        .then((response) => response.json())
        .catch((error) => { console.error(error) })
}

try {
    const extensionId = chrome.i18n.getMessage("@@extension_id");

    chrome.runtime.onMessage.addListener((message, sender) => {
        if (sender.tab) {
            if (message.event === "CLICK_ON_PAGE") {
                chrome.tabs.captureVisibleTab(null, {}, function (image) {
                    insertRecordingStepsIntoDb(
                        message.refreshToken,
                        message.userId,
                        message.sessionId,
                        {
                            clickedElementName: message.data.elementName,
                            image: image,
                            url: sender.tab.url,
                            website: sender.tab.url.split('/')[2],
                            setupId: extensionId,
                            timestamp: Date.now(),
                        }
                    )
                });
            } else if (message.event === 'STOP_RECORDING') {
                insertRecordingTimeIntoDb(
                    message.userId,
                    message.sessionId,
                    message.refreshToken,
                    message.data.recordingTime
                );
            }
        }
    });
} catch (error) {
    console.error(error);
}

chrome.webNavigation.onCommitted.addListener((details) => {
    if (["reload", "link"].includes(details.transitionType)) {
        chrome.webNavigation.onCompleted.addListener(function onComplete() {
            chrome.storage.local.get(["sessionId", "user"]).then((result) => {
                if (result?.sessionId && result?.user) {
                    chrome.tabs.sendMessage(
                        details.tabId,
                        {
                            startRecording: true,
                            userId: result.user.id,
                            refreshToken: result.user.refreshToken,
                            sessionId: result.sessionId,
                        }
                    );
                }
            })

            chrome.webNavigation.onCompleted.removeListener(onComplete);
        });
    }
});