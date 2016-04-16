var DEBUG = true;

var NEW_NOTIFICATION_ID = "clipSync_notification_new";
var IDS_KEY = "clipSync_ids";

var lastTextContent;
var currentContent;
var clipboardHistory = [];

/**
 * Load previously saved clipboards into memory
 */
function loadHistory(callback) {
    console.log("Loading clipboard history");
    clipboardHistory = [];
    getClipboardIds(function(ids) {
        ids.forEach(function(id, index) {
            getClipboard(id, function(clipboard) {
                clipboardHistory.push(clipboard);
                if (index == ids.length - 1) {
                    typeof callback === 'function' && callback();
                }
            });
        });
    })
}

/**
 * Returns currently loaded clipboardHistory
 * @returns {Array} Array of clipboards
 */
function getLoadedHistory() {
    console.log("Sharing loaded clipboardHistory");
    return clipboardHistory;
}

/**
 * Copy saved clipboard content to client clipboard
 */
function copyToClipboard(content) {
    console.log("Copying content to clipboard: " + content);
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
        iconUrl: "../resources/icon.png",
        buttons: [{title: "Copy"}, {title: "Dismiss"}]
    };
    chrome.notifications.create(NEW_NOTIFICATION_ID, options);
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

/**
 * Listen for notification button events
 */
chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
    if (notificationId === NEW_NOTIFICATION_ID) {
        if (buttonIndex === 0) {
            copyToClipboard(currentContent);
        }
        chrome.notifications.clear(NEW_NOTIFICATION_ID);
    }
});

loadHistory();