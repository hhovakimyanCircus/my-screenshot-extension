let currentRefreshToken = '';
let currentUseId = '';
let recordingStartTime = null;

const startRecordingBtn = document.getElementById('start-recording');
const stopRecordingBtn = document.getElementById('stop-recording');

const authorizedSection = document.getElementById('authorized');
const unauthorizedSection = document.getElementById('unauthorized');

const userFirstName = document.getElementById('userFirstName');

const startRecording = function () {
    stopRecordingBtn.addEventListener('click', stopRecording);

    chrome.runtime.sendMessage({
        type: 'webEventCaptured',
        event: 'MY_SCREENSHOTER_START_RECORDING',
        sessionId: generateUniqueSessionId()
    });

    window.close();
};

const stopRecording = function () {
    chrome.tabs.query({ active: true }).then((activeTabsResult) => {
        if (activeTabsResult?.[0]?.id) {
            const tabId = activeTabsResult[0].id;
            chrome.storage.local.get(["user", "recordingStartTime", "sessionId"]).then((result) => {
                chrome.tabs.sendMessage(
                    tabId,
                    {
                        stopRecording: true,
                        data: {
                            userId: result?.user?.id,
                            userName: result?.user?.name || '',
                            refreshToken: result?.user?.refreshToken,
                            sessionId: result?.sessionId,
                            recordingStartTime: result?.recordingStartTime,
                        }
                    }
                );

                startRecordingBtn.addEventListener('click', startRecording);

                recordingStartTime = null;
                chrome.storage.local.set({ recordingStartTime: null, sessionId: null, idToken: null, recording: false });

                // Close popup
                window.close();
            });
        }
    });
};

const onSignIn = function (authenticationData) {
    currentRefreshToken = authenticationData.refreshToken;
    currentUseId = authenticationData.id;
    if (recordingStartTime) {
        stopRecordingBtn.classList.remove('hidden');
        stopRecordingBtn.addEventListener('click', stopRecording);
    } else {
        startRecordingBtn.classList.remove('hidden');
        userFirstName.innerText = authenticationData.name.split(' ')[0];
        startRecordingBtn.addEventListener('click', startRecording);
    }

    unauthorizedSection.classList.add('hidden');
    authorizedSection.classList.remove('hidden');
}

const onSignOut = function () {
    currentRefreshToken =  '';
    currentUseId = '';

    if (recordingStartTime) {
        stopRecordingBtn.removeEventListener('click', stopRecording);
    } else {
        startRecordingBtn.removeEventListener('click', startRecording);
    }

    unauthorizedSection.classList.remove('hidden');
    authorizedSection.classList.add('hidden');

    chrome.storage.local.set({ recordingStartTime: null, sessionId: null, idToken: null });
}

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

window.onload = function () {
    chrome.storage.local.get(["user", "recordingStartTime"]).then((result) => {
        recordingStartTime = result?.recordingStartTime;

        if (result?.user) {
            onSignIn(result.user);
        } else {
            onSignOut();
        }
    });
}
