let currentRefreshToken = '';
let currentUseId = '';
let recordingStartTime = null;

const startRecordingBtn = document.getElementById('startRecordingBtn');
const stopRecordingBtn = document.getElementById('stopRecordingBtn');
const authenticateSection = document.getElementById('authenticateSection');
const recordingSection = document.getElementById('recordingSection');
const timer = document.getElementById('timer');
let recordingTimerId = null;

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
            chrome.tabs.sendMessage(
                result[0].id,
                {
                    startRecording: true,
                    userId: currentUseId,
                    refreshToken: currentRefreshToken
                }
            );
            startRecordingBtn.classList.add('hidden');
            stopRecordingBtn.addEventListener('click', stopRecording);
            recordingSection.classList.remove('hidden');

            recordingStartTime = Date.now();
            chrome.storage.local.set({ recordingStartTime: recordingStartTime });
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

            recordingStartTime = null;
            chrome.storage.local.set({ recordingStartTime: null });
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
    } else {
        startRecordingBtn.classList.add('hidden');
        startRecordingBtn.removeEventListener('click', startRecording);
    }

    authenticateSection.classList.remove('hidden');
    chrome.storage.local.set({ recordingStartTime: null });
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