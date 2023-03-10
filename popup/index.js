const startRecordingBtn = document.getElementById('startRecordingBtn');
startRecordingBtn.addEventListener('click', function () {
    chrome.tabs.query({ active: true }).then((result) => {
        chrome.tabs.sendMessage(result[0].id, {startRecording: true});
    });
})

const stopRecordingBtn = document.getElementById('stopRecordingBtn');
stopRecordingBtn.addEventListener('click', function () {
    chrome.tabs.query({ active: true }).then((result) => {
        chrome.tabs.sendMessage(result[0].id, {stopRecording: true});
    });
})