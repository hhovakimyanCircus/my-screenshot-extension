const firebaseConfig = {
    apiKey: "AIzaSyBTVcYHhjfq3QCa0kAqsV7b8q4NfLQiXho",
    databaseURL: "https://screenshoter-dfcd1-default-rtdb.firebaseio.com",
};

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

const insertRecordingTimeIntoDb = async (userId, recordingId, idToken, recordingTimeMilliSeconds) => {
    fetch(
        `${firebaseConfig.databaseURL}/users/${userId}/${recordingId}/details/.json?auth=${idToken}`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recordingTime: recordingTimeMilliSeconds,
            }),
        }
    )
        .then((response) => response.json())
        .catch((error) => { console.error(error) })
}

try {
    const extensionId = chrome.i18n.getMessage("@@extension_id");

    chrome.runtime.onMessage.addListener(async (message, sender) => {
        if (sender.tab && ["CLICK_ON_PAGE", "STOP_RECORDING"].includes(message.event)) {
            const result = await chrome.storage.local.get(["idToken"]);
            let idToken = result?.idToken;
            if (!idToken) {
                idToken = await refreshIdToken(message.refreshToken);
                chrome.storage.local.set({ idToken });
            }

            switch (message.event) {
                case 'CLICK_ON_PAGE':
                    chrome.tabs.captureVisibleTab(null, {}, function (image) {
                        chrome.tabs.sendMessage(sender.tab.id, {
                            event: "TAB_CAPTURED",
                            userId: message.userId,
                            sessionId: message.sessionId,
                            image,
                            eventData: message.eventData,
                            idToken,
                            clickedElementName: message.data.elementName,
                            extensionId,
                            sender,
                        });
                    });
                    break;
                case 'STOP_RECORDING':
                    insertRecordingTimeIntoDb(
                        message.userId,
                        message.sessionId,
                        idToken,
                        message.data.recordingTime
                    );
                    chrome.tabs.create(
                        { url: `https://app.flowl.app/recording/${message.sessionId}` }
                    );
                    break;
                default:
                    break;
            }
        }
    });
} catch (error) {
    console.error(error);
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('refreshIdToken', { periodInMinutes: 50 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'refreshIdToken') {
        chrome.storage.local.get(["user"]).then(async (result) => {
            if (result?.user) {
                const idToken = await refreshIdToken(result.user.refreshToken);
                chrome.storage.local.set({ idToken });
            }
        });
    }
});

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
                            tabChange: true,
                        }
                    );
                }
            })

            chrome.webNavigation.onCompleted.removeListener(onComplete);
        });
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    chrome.tabs.sendMessage(tabId, {
        event: 'URL_CHANGE',
        data: {tabId, changeInfo, tab}
    })
})