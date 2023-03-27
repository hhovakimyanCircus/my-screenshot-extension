let currentRefreshToken = '';
let currentUseId = '';
let recordingStartTime = null;

const startRecordingBtn = document.getElementById('startRecordingBtn');
const stopRecordingBtn = document.getElementById('stopRecordingBtn');
const authenticateSection = document.getElementById('authenticateSection');
const recordingSection = document.getElementById('recordingSection');

const startRecordingFunction = function () {
    chrome.tabs.query({ active: true }).then((result) => {
        if (result?.[0]?.id) {
            chrome.tabs.sendMessage(
                result[0].id,
                {
                    startRecording: true,
                    userId: currentUseId,
                    refreshToken: currentRefreshToken
                }
            );
            startRecordingBtn.classList.add('hidden');
            recordingSection.classList.remove('hidden');
            recordingStartTime = Date.now();
            chrome.storage.local.set({ recordingStartTime: recordingStartTime });
        }
    });
};

const stopRecordingFunction = function () {
    chrome.tabs.query({ active: true }).then((result) => {
        if (result?.[0]?.id) {
            chrome.tabs.sendMessage(result[0].id, {stopRecording: true});
            startRecordingBtn.classList.remove('hidden');
            recordingSection.classList.add('hidden');
            recordingStartTime = null;
            chrome.storage.local.set({ recordingStartTime: null });
        }
    });
};

const onSignIn = function (authenticationData) {
    currentRefreshToken = authenticationData.refreshToken;
    currentUseId = authenticationData.id;
    if (recordingStartTime) {
        recordingSection.classList.remove('hidden');
        stopRecordingBtn.addEventListener('click', stopRecordingFunction);
    } else {
        startRecordingBtn.classList.remove('hidden');
        startRecordingBtn.addEventListener('click', startRecordingFunction);
    }

    authenticateSection.classList.add('hidden');
}

const onSignOut = function () {
    currentRefreshToken =  '';
    currentUseId = '';

    if (recordingStartTime) {
        recordingSection.classList.add('hidden');
        stopRecordingBtn.removeEventListener('click', stopRecordingFunction);
    } else {
        startRecordingBtn.classList.add('hidden');
        startRecordingBtn.removeEventListener('click', startRecordingFunction);
    }

    authenticateSection.classList.remove('hidden');
    chrome.storage.local.set({ recordingStartTime: null });
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