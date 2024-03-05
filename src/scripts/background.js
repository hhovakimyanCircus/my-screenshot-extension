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

const insertRecordingTimeIntoDb = async (userId, recordingId, idToken, recordingTimeMilliSeconds, userName) => {
    fetch(
        `${firebaseConfig.databaseURL}/users/${userId}/${recordingId}/details/.json?auth=${idToken}`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recordingTime: recordingTimeMilliSeconds,
                userName: userName,
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
                    await chrome.tabs.query({}).then(tabs => {
                        tabs.forEach(tab => {
                            chrome.tabs.sendMessage(
                                tab.id,
                                {
                                    clearRecordingScreen: true,
                                }
                            )
                        })
                    })

                    await insertRecordingTimeIntoDb(
                        message.userId,
                        message.sessionId,
                        idToken,
                        message.data.recordingTime,
                        message.data.userName,
                    );

                    await chrome.storage.local.set({ recordingStartTime: null, sessionId: null, idToken: null, recording: false });

                    await chrome.tabs.create(
                        { url: `https://app.flowl.app/instructiondoc/${message.sessionId}` }
                    );
                    break;
                default:
                    break;
            }
        } else if (message.event === 'MY_SCREENSHOTER_START_RECORDING') {
            chrome.storage.local.get((res) => {
                if (res?.user) {
                    chrome.tabs.query({}).then(tabs => {
                        tabs.forEach(tab => {
                            chrome.tabs.sendMessage(
                                tab.id,
                                {
                                    startRecording: true,
                                    userId: res.user.id,
                                    refreshToken: res.user.refreshToken,
                                    sessionId: message.sessionId,
                                }
                            )
                        })

                        const recordingStartTime = Date.now();

                        chrome.storage.local.set({
                            recordingStartTime: recordingStartTime,
                            sessionId: message.sessionId,
                            recording: true,
                        });
                    })
                }
            })
        } else if (message.event === 'MY_SCREENSHOTER_GET_TABS') {
            chrome.tabs.query({ currentWindow: true }).then(result => {
                chrome.tabs.sendMessage(sender.tab.id, {
                    event: 'GET_TABS_RESULT',
                    data: result,
                })
            })
        } else if (message.event === 'MY_SCREENSHOTER_RECORD_SELECTED_TAB') {
            chrome.storage.local.get((res) => {
                if (res?.user) {
                    chrome.tabs.query({ index: message.tabIndex }).then(result => {
                        chrome.tabs.sendMessage(
                            result[0].id,
                            {
                                startRecording: true,
                                userId: res.user.id,
                                refreshToken: res.user.refreshToken,
                                sessionId: message.sessionId,
                            }
                        );

                        const recordingStartTime = Date.now();

                        chrome.storage.local.set({
                            recordingStartTime: recordingStartTime,
                            sessionId: message.sessionId,
                            recording: true,
                        });
                    })
                }
            })
        }
    });
} catch (error) {
    console.error(error);
}

chrome.runtime.onInstalled.addListener(async () => {
    chrome.alarms.create('refreshIdToken', { periodInMinutes: 50 });

    for (const cs of chrome.runtime.getManifest().content_scripts) {
        for (const tab of await chrome.tabs.query({ url: cs.matches })) {
            chrome.scripting.executeScript({
                files: cs.js,
                target: { tabId: tab.id, allFrames: cs.all_frames },
                injectImmediately: cs.run_at === 'document_start',
            });
        }
    }
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
        data: { tabId, changeInfo, tab }
    })
})