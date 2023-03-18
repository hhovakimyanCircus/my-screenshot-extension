import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.4/firebase-app.js";
import { getDatabase, ref, set, push } from "https://www.gstatic.com/firebasejs/9.6.4/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBTVcYHhjfq3QCa0kAqsV7b8q4NfLQiXho",
    authDomain: "screenshoter-dfcd1.firebaseapp.com",
    databaseURL: "https://screenshoter-dfcd1-default-rtdb.firebaseio.com",
    projectId: "screenshoter-dfcd1",
    storageBucket: "screenshoter-dfcd1.appspot.com",
    messagingSenderId: "957518554914",
    appId: "1:957518554914:web:6b11bd5b963412a453277b",
};

try {
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    const dataListRef = ref(database, 'data');
    const extensionId = chrome.i18n.getMessage("@@extension_id");

    chrome.runtime.onMessage.addListener((message, sender) => {
        if (sender.tab && message.event === "CLICK_ON_PAGE") {
            chrome.tabs.captureVisibleTab(null, {}, function (image) {
                const newItemRef = push(dataListRef);
                set(
                    newItemRef,
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
} catch (error) {
    console.error(error);
}