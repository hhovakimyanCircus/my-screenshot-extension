const firebaseConfig = {
    apiKey: "AIzaSyBTVcYHhjfq3QCa0kAqsV7b8q4NfLQiXho",
    databaseURL: "https://screenshoter-dfcd1-default-rtdb.firebaseio.com",
};

let idToken;

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

const insertIntoDatabase = async (refreshToken, userId, sessionId, data) => {
    if (!idToken) {
        idToken = await refreshIdToken(refreshToken);
    }

    fetch(`${firebaseConfig.databaseURL}/users/${userId}/${sessionId}/.json?auth=${idToken}`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .catch((error) => { console.error(error) })
}

try {
    const extensionId = chrome.i18n.getMessage("@@extension_id");

    chrome.runtime.onMessage.addListener((message, sender) => {
        if (sender.tab && message.event === "CLICK_ON_PAGE") {
            chrome.tabs.captureVisibleTab(null, {}, function (image) {
                insertIntoDatabase(
                    message.refreshToken,
                    message.userId,
                    message.sessionId,
                    {
                        clickedElementName: message.data.elementName,
                        image: image,
                        url: sender.tab.url,
                        website: sender.tab.url.split('/')[2],
                        setupId: extensionId,
                        timestamp: Date.now(),
                    }
                )
            });
        }
    });
} catch (error) {
    console.error(error);
}