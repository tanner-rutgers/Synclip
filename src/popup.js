var SENT_NOTIFICATION_ID = "clipSync_notification_sent";
var CLIPBOARD_PREFIX = "clipSync_clipboard_";
var IDS_KEY = "clipSync_ids";
var HISTORY_SIZE = 5;

var backgroundPage = chrome.extension.getBackgroundPage();
function log(message) {
    backgroundPage.console.log(message);
}
function error(message) {
    backgroundPage.console.error(message);
}

/**
 * Saves given content to file sync
 * @param content String content to publish
 */
function sendClipboard() {
    var content = document.getElementById("clipboard").innerHTML;
    log("Saving clipboard content");
    // Get unique client id to mark who sent the clipboard
    chrome.instanceID.getID(function(id) {
        if (chrome.runtime.lastError) {
            error("Error retrieving instanceID: " + chrome.runtime.lastError.message);
            return;
        }
        // Get list of saved clipboard ids
        getClipboardIds(function(ids) {
            var nextId = 1;
            if (ids.length > 0) {
                nextId = ids[ids.length - 1] + 1;
            }
            ids.push(nextId);
            // If clipboard is full, remove oldest
            if (ids.size > HISTORY_SIZE) {
                removeClipboardWithId(ids.shift());
            }
            // Save new clipboard
            var clipboard = {};
            clipboard[CLIPBOARD_PREFIX + nextId] = {
                content: content,
                from: id
            };
            chrome.storage.sync.set(clipboard, function() {
                if (chrome.runtime.lastError) {
                    error("Error saving clipboard content: " + chrome.runtime.lastError.message);
                    return;
                }
                // Notify that we saved.
                log('Saved clipboard with id: ' + nextId);
                // Save new clipboard ids
                saveClipboardIds(ids);
            });
        })

        
    });
}

/**
 * Retrieves saved clipboard ids
 * @param callback Callback function to accept retrieved clipboard ids
 */
function getClipboardIds(callback) {
    log("Retrieving clipboard ids");
    var defaultIds = {};
    defaultIds[IDS_KEY] = [];
    chrome.storage.sync.get(defaultIds, function(savedIds) {
        if (chrome.runtime.lastError) {
            error("Error retrieving clipboard size: " + chrome.runtime.lastError.message);
            return;
        }
        callback(savedIds[IDS_KEY]);
    })
}

/**
 * Save the given clipboard ids
 * @param ids Array of ids to save
 */
function saveClipboardIds(ids) {
    log("Saving clipboard ids");
    var idsToSave = {};
    idsToSave[IDS_KEY] = ids;
    chrome.storage.sync.set(idsToSave, function() {
        if (chrome.runtime.lastError) {
            error("Error saving clipboard ids: " + chrome.runtime.lastError.message);
            return;
        }
        log("Saved clipboard ids");
    })
}

/**
 * Remove the clipboard with given id
 * @param id ID of clipboard to remove
 */
function removeClipboardWithId(id) {
    log("Removing clipboard with id: " + id);
    chrome.storage.sync.remove(CLIPBOARD_PREFIX + id, function() {
        if (chrome.runtime.lastError) {
            error("Error removing clipboard: " + chrome.runtime.lastError.message);
        }
        log("Removed clipboard with id: " + id);
    })
}

/**
 * Retrieves clipboard content
 * @param callback Callback function to accept retrieved content
 */
function showClipboardContent() {
    log("Retrieving content from client clipboard");
    var sandbox = document.getElementById("sandbox");
    sandbox.style.display = "block";
    var result = '';
    sandbox.select();
    if (document.execCommand("paste")) {
        result = sandbox.value;
        document.getElementById('clipboard').textContent = result;
        log("Retrieved data from client clipboard: " + result);
    } else {
        error("Error pasting client clipboard");
    }
    sandbox.value = '';
    sandbox.style.display = "none";
}

/**
 * Perfom actions once popup is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    log("Extension activated");
    document.getElementById("clipboardForm").addEventListener("submit", function(event) {
        event.preventDefault();
        sendClipboard();
    });
    showClipboardContent();
});