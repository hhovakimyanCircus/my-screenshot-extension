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
        event: 'MY_SCREENSHOTER_START_RECORDING',
        sessionId: generateUniqueSessionId()
    }, () => {
        window.close();
    });
};

const stopRecording = () => {
    chrome.tabs.query({ active: true }).then(tab => {
        chrome.tabs.sendMessage(tab[0].id, { stopRecordingFromPopup: true })
    })
}

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
