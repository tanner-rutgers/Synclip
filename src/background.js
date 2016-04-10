var DEBUG = true;

var NEW_NOTIFICATION_ID = "clipSync_notification_new";
var CLIPBOARD_PREFIX = "clipSync_clipboard_";
var IDS_KEY = "clipSync_ids";

var currentContent;

/**
 * Copy saved clipboard content to client clipboard
 */
function copyToClipboard() {
    console.log("Copying content to clipboard");
    var sandbox = document.getElementById("sandbox");
    sandbox.value = content;
    sandbox.select();
    if (document.execCommand("copy")) {
        console.log("Copied content to clipboard");
    } else {
        console.error("Error copying content to clipboard");
    }
    sandbox.value = '';
}

/**
 * Show notification when new content is received
 * @param content
 */
function showNewContentNotification(content) {
    console.log("Showing new content notification");
    var options = {
        type: "basic",
        title: "ClipSync",
        message: "Received: " + content,
        iconUrl: "icon.png",
        buttons: [{title: "Copy"}, {title: "Dismiss"}]
    };
    chrome.notifications.create(NEW_NOTIFICATION_ID, options);
}

/**
 *
 * @param id
 * @param callback
 */
function getClipboard(id, callback) {
    console.log("Retrieving clipboard with id: " + id);
    chrome.storage.sync.get(CLIPBOARD_PREFIX + id, function(clipboard) {
        if (chrome.runtime.lastError) {
            error("Error retrieving clipboard: " + chrome.runtime.lastError.message);
            return;
        }
        callback(clipboard[CLIPBOARD_PREFIX + id]);
    })
}

/**
 * Listen for storage changes
 */
chrome.storage.onChanged.addListener(function(changes, areaName) {
    console.log("Storage change detected: " + changes);
    if (changes[IDS_KEY]) {
        chrome.instanceID.getID(function (id) {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving instanceID: " + chrome.runtime.lastError.message);
                return;
            }
            var change = changes[IDS_KEY];
            var clipboardIds = change.newValue;
            var newClipboardId = clipboardIds[clipboardIds.length - 1];
            getClipboard(newClipboardId, function(clipboard) {
                if (DEBUG || id !== clipboard.from) {
                    console.log("Content is from other client");
                    currentContent = clipboard.content;
                    showNewContentNotification(clipboard.content);
                } else {
                    console.log("Content is from us, no action taken");
                }
            });
        });
    }
});

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
    if (notificationId === NEW_NOTIFICATION_ID) {
        if (buttonIndex === 0) {
            copyToClipboard();
        }
        chrome.notifications.clear(NEW_NOTIFICATION_ID);
    }
});