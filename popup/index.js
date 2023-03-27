let currentRefreshToken = '';
let currentUseId = '';

const startRecordingBtn = document.getElementById('startRecordingBtn');
const stopRecordingBtn = document.getElementById('stopRecordingBtn');
const authenticateSection = document.getElementById('authenticateSection');
const recordingSection = document.getElementById('recordingSection');

const startRecordingFunction = function () {
    chrome.tabs.query({ active: true }).then((result) => {
        if (result?.[0]?.id) {
            chrome.tabs.sendMessage(result[0].id, {startRecording: true, userId: currentUseId, refreshToken: currentRefreshToken});
            startRecordingBtn.classList.add('hidden');
            recordingSection.classList.remove('hidden');
        }
    });
};

const stopRecordingFunction = function () {
    chrome.tabs.query({ active: true }).then((result) => {
        if (result?.[0]?.id) {
            chrome.tabs.sendMessage(result[0].id, {stopRecording: true});
            startRecordingBtn.classList.remove('hidden');
            recordingSection.classList.add('hidden');
        }
    });
};

const onSignIn = function (authenticationData) {
    currentRefreshToken = authenticationData.refreshToken;
    currentUseId = authenticationData.id;
    startRecordingBtn.classList.remove('hidden');
    authenticateSection.classList.add('hidden');

    startRecordingBtn.addEventListener('click', startRecordingFunction);
    stopRecordingBtn.addEventListener('click', stopRecordingFunction);
}

const onSignOut = function () {
    currentRefreshToken =  '';
    currentUseId = '';
    startRecordingBtn.classList.add('hidden');
    authenticateSection.classList.remove('hidden');

    startRecordingBtn.removeEventListener('click', startRecordingFunction);
    stopRecordingBtn.removeEventListener('click', stopRecordingFunction);
}

chrome.storage.local.get(["user"]).then((result) => {
    if (result?.user) {
        onSignIn(result.user);
    } else {
        onSignOut();
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    const authenticationData = changes.user?.newValue || null;
    if (authenticationData) {
        onSignIn(authenticationData);
    } else {
        onSignOut();
    }
});