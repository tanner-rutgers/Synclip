var CLIPBOARD_FILE = "clipboard.txt";
var NEW_NOTIFICATION_ID = "clipSync_notification_new";
var SENT_NOTIFICATION_ID = "clipSync_notification_sent";
var STORAGE_KEY = "clipSync_clipboard";

/**
 * Show notification when new content is sent
 * @param content
 */
function showSentClipboardNotification(content) {
    console.log("Showing sent clipboard notification");
    var options = {
        type: "basic",
        title: "ClipSync clipboard",
        message: "Sent: " + content,
        iconUrl: "icon.png"
    };
    chrome.notifications.create(SENT_NOTIFICATION_ID, options);
}

/**
 * Saves given content to file sync
 * @param content String content to publishs
 */
function sendClipboard(content) {
    console.log("Saving clipboard content: " + content);
    chrome.storage.sync.set({STORAGE_KEY: content}, function() {
        if (chrome.runtime.lastError) {
            console.log("Error saving clipboard content: " + chrome.runtime.lastError.message);
            return;
        }
        // Notify that we saved.
        console.log('Saved clipboard content');
        showSentClipboardNotification(content);
    });
}

/**
 * Retrieves clipboard content
 * @param callback Callback function to accept retrieved content
 */
function getClipboardContent(callback) {
    console.log("Retrieving content from clipboard");
    var sandbox = document.getElementById("sandbox");
    var result = '';
    sandbox.select();
    if (document.execCommand("paste")) {
        result = sandbox.value;
        console.log("Retrieved data from clipboard: " + result);
    } else {
        console.log("Error pasting clipboard");
    }
    sandbox.value = '';
    callback(result);
}

/**
 * Listen for extension click events
 */
chrome.browserAction.onClicked.addListener(function(tab) {
    console.log("Extension activated");
    getClipboardContent(function(content) {
        sendClipboard(content);
    })
});

/**
 * Show notification when new content is received
 * @param content
 */
function showNewContentNotification(content) {
    console.log("Showing new content notification");
    var options = {
        type: "basic",
        title: "ClipSync clipboard",
        message: "Received: " + content,
        iconUrl: "icon.png",
        buttons: [{title: "Copy"}, {title: "Dismiss"}]
    };
    chrome.notifications.create(NEW_NOTIFICATION_ID, options);
}

/**
 * Listen for storage changes
 */
chrome.storage.onChanged.addListener(function(changes, areaName) {
    console.log("Storage change detected");
    console.log(changes);
    if (areaName === "sync" && changes.STORAGE_KEY) {
        var change = changes.STORAGE_KEY;
        showNewContentNotification(change.newValue);
    }
});