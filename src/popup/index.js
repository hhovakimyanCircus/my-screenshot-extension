let currentRefreshToken = '';
let currentUseId = '';
let recordingStartTime = null;

const startRecordingBtn = document.getElementById('startRecordingBtn');
const startRecordingSection = document.getElementById('startRecordingSession');
const stopRecordingBtn = document.getElementById('stopRecordingBtn');
const authenticateSection = document.getElementById('authenticateSection');
const stopRecordingSection = document.getElementById('stopRecordingSection');
const userFirstName = document.getElementById('userFirstName');

const startRecording = function () {
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
                startRecordingSection.classList.remove('hidden');
                stopRecordingSection.classList.add('hidden');

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
        stopRecordingSection.classList.remove('hidden');
        stopRecordingBtn.addEventListener('click', stopRecording);
    } else {
        startRecordingSection.classList.remove('hidden');
        userFirstName.innerText = authenticationData.name.split(' ')[0];
        startRecordingBtn.addEventListener('click', startRecording);
    }

    authenticateSection.classList.add('hidden');
}

const onSignOut = function () {
    currentRefreshToken =  '';
    currentUseId = '';

    if (recordingStartTime) {
        stopRecordingSection.classList.add('hidden');
        stopRecordingBtn.removeEventListener('click', stopRecording);
    } else {
        startRecordingSection.classList.add('hidden');
        startRecordingBtn.removeEventListener('click', startRecording);
    }

    authenticateSection.classList.remove('hidden');
    chrome.storage.local.set({ recordingStartTime: null, sessionId: null, idToken: null });
}

chrome.storage.local.get(["user", "recordingStartTime"]).then((result) => {
    recordingStartTime = result?.recordingStartTime;

    if (result?.user) {
        onSignIn(result.user);
    } else {
        onSignOut();
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