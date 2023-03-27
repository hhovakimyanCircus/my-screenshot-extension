const firebaseConfig = {
    apiKey: "AIzaSyBTVcYHhjfq3QCa0kAqsV7b8q4NfLQiXho",
    authDomain: "screenshoter-dfcd1.firebaseapp.com",
    databaseURL: "https://screenshoter-dfcd1-default-rtdb.firebaseio.com",
    projectId: "screenshoter-dfcd1",
    storageBucket: "screenshoter-dfcd1.appspot.com",
    messagingSenderId: "957518554914",
    appId: "1:957518554914:web:6b11bd5b963412a453277b",
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

const insertIntoDatabase = async (refreshToken, userId, data) => {
    if (!idToken) {
        idToken = await refreshIdToken(refreshToken);
    }

    fetch(`${firebaseConfig.databaseURL}/${userId}/data.json?auth=${idToken}`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
        }).catch((error) => { console.error(error) })
}

try {
    const extensionId = chrome.i18n.getMessage("@@extension_id");

    chrome.runtime.onMessage.addListener((message, sender) => {
        if (sender.tab && message.event === "CLICK_ON_PAGE") {
            chrome.tabs.captureVisibleTab(null, {}, function (image) {
                insertIntoDatabase(
                    message.refreshToken,
                    message.userId,
                    {
                        clickedElementName: message.data.elementName,
                        image: image,
                        url: sender.tab.url,
                        website: sender.tab.url.split('/')[2],
                        setupId: extensionId,
                        date: new Date().toLocaleString(),
                        sessionId: message.sessionId,
                    }
                )
            });
        }
    });


    chrome.runtime.onMessageExternal.addListener( (message, sender, sendResponse) => {
        if (message.event === 'LOGIN') {
            chrome.storage.local.set({ user: {id: message.userId, refreshToken: message.refreshToken} });
        } else if (message.event === 'LOGOUT') {
            chrome.storage.local.set({ user: null });
        }
    });
} catch (error) {
    console.error(error);
}