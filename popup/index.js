let currentRefreshToken = '';
let currentUseId = '';
let recordingStartTime = null;

const startRecordingBtn = document.getElementById('startRecordingBtn');
const stopRecordingBtn = document.getElementById('stopRecordingBtn');
const authenticateSection = document.getElementById('authenticateSection');
const recordingSection = document.getElementById('recordingSection');
const recordingLinkSection = document.getElementById('recordingLinkSection');
const recordingLink = document.getElementById('recordingLink');
const timer = document.getElementById('timer');
let recordingTimerId = null;

function generateUniqueSessionId() {
    const randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    let hex = '';
    for (let i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }

    return hex;
}

const updateRecordingTimer = function (startTime) {
    let currentDiffTimestamp = Math.ceil((Date.now() - startTime) / 1000);
    let currentMinutes = Math.floor(currentDiffTimestamp / 60);
    let currentSeconds = currentDiffTimestamp - (currentMinutes * 60);
    timer.innerText = String(currentMinutes).padStart(2, '0') + ":" + String(currentSeconds).padStart(2, '0');
}

const startRecordingTimer = function () {
    stopRecordingTimer();
    updateRecordingTimer(recordingStartTime);
    recordingTimerId = setInterval(() => {
        updateRecordingTimer(recordingStartTime)
    }, 1000);
}

const stopRecordingTimer = function () {
    if (recordingTimerId) {
        clearInterval(recordingTimerId);
        recordingTimerId = null;
    }
}

const startRecording = function () {
    chrome.tabs.query({ active: true }).then((result) => {
        if (result?.[0]?.id) {
            const currentSessionId = generateUniqueSessionId();
            chrome.tabs.sendMessage(
                result[0].id,
                {
                    startRecording: true,
                    userId: currentUseId,
                    refreshToken: currentRefreshToken,
                    sessionId: currentSessionId,
                }
            );
            startRecordingBtn.classList.add('hidden');
            stopRecordingBtn.addEventListener('click', stopRecording);
            recordingSection.classList.remove('hidden');
            recordingLinkSection.classList.add('hidden');

            recordingStartTime = Date.now();
            chrome.storage.local.set({ recordingStartTime: recordingStartTime, sessionId: currentSessionId });
            startRecordingTimer();
        }
    });
};

const stopRecording = function () {
    chrome.tabs.query({ active: true }).then((result) => {
        if (result?.[0]?.id) {
            chrome.tabs.sendMessage(result[0].id, {stopRecording: true});
            startRecordingBtn.addEventListener('click', startRecording);
            startRecordingBtn.classList.remove('hidden');
            recordingSection.classList.add('hidden');
            chrome.storage.local.get(["sessionId"]).then((result) => {
                recordingLinkSection.classList.remove('hidden');
                recordingLink.setAttribute('href', `https://screenshoter-dfcd1.web.app/recording/${result?.sessionId}`)
            })

            recordingStartTime = null;
            chrome.storage.local.set({ recordingStartTime: null, sessionId: null });
            stopRecordingTimer();
        }
    });
};

const onSignIn = function (authenticationData) {
    currentRefreshToken = authenticationData.refreshToken;
    currentUseId = authenticationData.id;
    if (recordingStartTime) {
        recordingSection.classList.remove('hidden');
        stopRecordingBtn.addEventListener('click', stopRecording);
        startRecordingTimer();
    } else {
        startRecordingBtn.classList.remove('hidden');
        startRecordingBtn.addEventListener('click', startRecording);
    }

    authenticateSection.classList.add('hidden');
}

const onSignOut = function () {
    currentRefreshToken =  '';
    currentUseId = '';

    if (recordingStartTime) {
        recordingSection.classList.add('hidden');
        stopRecordingBtn.removeEventListener('click', stopRecording);
        recordingLinkSection.classList.add('hidden');
    } else {
        startRecordingBtn.classList.add('hidden');
        startRecordingBtn.removeEventListener('click', startRecording);
    }

    authenticateSection.classList.remove('hidden');
    chrome.storage.local.set({ recordingStartTime: null, sessionId: null });
    stopRecordingTimer();
}

chrome.storage.local.get(["user", "recordingStartTime"]).then((result) => {
    recordingStartTime = result?.recordingStartTime;

    if (result?.user) {
        onSignIn(result.user);
    } else {
        onSignOut();
    }
});

chrome.webNavigation.onCommitted.addListener((details) => {
    if (["reload", "link"].includes(details.transitionType)) {
        chrome.webNavigation.onCompleted.addListener(function onComplete() {
            chrome.storage.local.get(["sessionId"]).then((result) => {
                if (result?.sessionId) {
                    chrome.tabs.sendMessage(
                        details.tabId,
                        {
                            startRecording: true,
                            userId: currentUseId,
                            refreshToken: currentRefreshToken,
                            sessionId: result.sessionId,
                        }
                    );
                }
            })

            chrome.webNavigation.onCompleted.removeListener(onComplete);
        });
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if ("user" in changes) {
        const authenticationData = changes.user?.newValue || null;
        if (authenticationData) {
            onSignIn(authenticationData);
        } else {
            onSignOut();
        }
    }
});