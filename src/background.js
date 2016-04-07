var CLIPBOARD_FILE = "clipboard.txt";
var NOTIFICATION_ID = "clipSync_notification";
var STORAGE_KEY = "clipSync_clipboard";

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

chrome.browserAction.onClicked.addListener(function(tab) {
    console.log("Extension activated");
    getClipboardContent(function(content) {
        sendClipboard(content);
    })
});

function showNewContentNotification(content) {
    console.log("Showing new content notification");
    var options = {
        type: "basic",
        title: "New ClipSync content!",
        message: content,
        iconUrl: "icon.png"
    };
    chrome.notifications.clear(NOTIFICATION_ID, function() {
        chrome.notifications.create(NOTIFICATION_ID, options);
    });
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
    console.log("Storage change detected");
    if (changes[STORAGE_KEY]) {
        var change = changes[STORAGE_KEY];
        showNewContentNotification(change.newValue);
    }
});