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
 * @param content String content to publish
 */
function sendClipboard(content) {
    console.log("Saving clipboard content: " + content);
    var clipboard = {};
    chrome.instanceID.getID(function(id) {
        if (chrome.runtime.lastError) {
            console.error("Error retrieving instanceID: " + chrome.runtime.lastError.message);
            return;
        }
        clipboard[STORAGE_KEY] = {
            content: content,
            from: id
        }
        chrome.storage.sync.set(clipboard, function() {
            if (chrome.runtime.lastError) {
                console.error("Error saving clipboard content: " + chrome.runtime.lastError.message);
                return;
            }
            // Notify that we saved.
            console.log('Saved clipboard content');
            showSentClipboardNotification(content);
        });
    });
}

/**
 * Retrieves clipboard content
 * @param callback Callback function to accept retrieved content
 */
function getClipboardContent(callback) {
    console.log("Retrieving content from client clipboard");
    var sandbox = document.getElementById("sandbox");
    var result = '';
    sandbox.select();
    if (document.execCommand("paste")) {
        result = sandbox.value;
        console.log("Retrieved data from client clipboard: " + result);
    } else {
        console.error("Error pasting client clipboard");
    }
    sandbox.value = '';
    callback(result);
}

/**
 * Copy saved clipboard content to client clipboard
 */
function copyToClipboard() {
    console.log("Retrieving saved clipboard content");
    chrome.storage.sync.get(STORAGE_KEY, function(content) {
        var sandbox = document.getElementById("sandbox");
        sandbox.value = content[STORAGE_KEY];
        sandbox.select();
        if (document.execCommand("copy")) {
            console.log("Copied content to clipboard");
        } else {
            console.error("Error copying content to clipboard");
        }
        sandbox.value = '';
    })
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
    if (changes[STORAGE_KEY]) {
        chrome.instanceID.getID(function (id) {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving instanceID: " + chrome.runtime.lastError.message);
                return;
            }
            var change = changes[STORAGE_KEY];
            if (id !== change.newValue.from) {
                console.log("Content is from other client");
                showNewContentNotification(change.newValue.content);
            } else {
                console.log("Content was from us, no action taken");
            }
        });
    }
});

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
    if (notificationId === NEW_NOTIFICATION_ID) {
        if (buttonIndex === 0) {
            copyToClipboard();
        } else if (buttonIndex === 1) {
            chrome.notifications.clear(NEW_NOTIFICATION_ID);
        }
    }
})