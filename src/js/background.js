var DEBUG = true;

var NEW_NOTIFICATION_ID = "synclip_notification_new";
var IDS_KEY = "synclip_ids";

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
 * Get and return current client clipboard content
 * @param callback Callback accepting content
 */
function getClientClipboard(callback) {
    console.log("Retrieving content from client clipboard");
    var sandbox = document.getElementById("sandbox");
    var result = '';
    sandbox.select();
    if (document.execCommand("paste")) {
        result = sandbox.value;
        if (result && result.length > 0) {
            lastTextContent = result;
            callback(result);
        } else if (lastTextContent && lastTextContent.length > 0) {
            callback(lastTextContent);
        } else {
            console.log("No text in clipboard or history");
        }
        sandbox.value = '';
    } else {
        console.error("Error pasting client clipboard");
    }
}

/**
 * Show notification when new content is received
 * @param content
 */
function showNewContentNotification(content) {
    console.log("Showing new content notification");
    var options = {
        type: "basic",
        title: "Synclip",
        message: content,
        iconUrl: "../resources/icon80.png",
        buttons: [{title: "Copy"}, {title: "Dismiss"}]
    };
    chrome.notifications.create(NEW_NOTIFICATION_ID, options);
}

/**
 * Save the given content and reload history
 * @param content Content to save
 * @param callback
 */
function saveClipboard(content, callback) {
    console.log("Saving clipboard");
    saveNewClipboard(content, function(error) {
        if (error) {
            return callback(error);
        }
        loadHistory(callback);
    });
}

/**
 * Listen for and handle storage changes
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
                    loadHistory(function() {
                        showNewContentNotification(clipboard.content);
                    });
                } else {
                    console.log("Content is from us, no action taken");
                }
            });
        });
    }
});

/**
 * Listen for and handle notification button events
 */
chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
    if (notificationId === NEW_NOTIFICATION_ID) {
        if (buttonIndex === 0) {
            copyToClipboard(currentContent);
        }
        chrome.notifications.clear(NEW_NOTIFICATION_ID);
    }
});

/**
 * Enable/disable functionality based on signed in status
 */
chrome.identity.getProfileUserInfo(function(userInfo) {
    console.log("Checking if user signed in...");
    if (userInfo.email && userInfo.email.length > 0) {
        console.log("User signed in, enabling popup");
        chrome.browserAction.setPopup({popup: "pages/popup.html"});
        chrome.browserAction.setIcon({
            "path": {
                "19": "../resources/icon19.png",
                "38": "../resources/icon38.png"
            }
        });
        loadHistory();
    } else {
        console.log("User not signed in, disabling popup");
        chrome.browserAction.setPopup({popup: "pages/disabled.html"});
        chrome.browserAction.setIcon({
            "path": {
                "19": "../resources/icon19_disabled.png",
                "38": "../resources/icon38_disabled.png"
            }
        });
    }
});

/**
 * Listen for sign in changes and reload extension
 */
chrome.identity.onSignInChanged.addListener(function(account, signedIn) {
    console.log("Sign in change detected, reloading extension");
    chrome.runtime.reload();
});