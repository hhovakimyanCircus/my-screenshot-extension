import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.4/firebase-app.js";
import { getDatabase, ref, set, push } from "https://www.gstatic.com/firebasejs/9.6.4/firebase-database.js";

try {
    const firebaseConfig = {
        apiKey: "AIzaSyBTVcYHhjfq3QCa0kAqsV7b8q4NfLQiXho",
        authDomain: "screenshoter-dfcd1.firebaseapp.com",
        databaseURL: "https://screenshoter-dfcd1-default-rtdb.firebaseio.com",
        projectId: "screenshoter-dfcd1",
        storageBucket: "screenshoter-dfcd1.appspot.com",
        messagingSenderId: "957518554914",
        appId: "1:957518554914:web:6b11bd5b963412a453277b",
    };

    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    const dataListRef = ref(database, 'data');

    chrome.runtime.onMessage.addListener((message, sender) => {
        if (sender.tab && message.event === "CLICK_ON_PAGE") {
            chrome.tabs.captureVisibleTab(null, {}, function (image) {
                const newItemRef = push(dataListRef);
                set(newItemRef, {
                    clickedElementName: message.data.elementName,
                    image: image,
                })
            });
        }
    });
} catch (error) {
    console.error(error);
}