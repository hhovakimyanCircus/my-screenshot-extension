window.isScreenshoterExtensionInstalled = true;

const customEvent = new CustomEvent('ping-from-extension');

document.dispatchEvent(customEvent);
