var CLIPBOARD_PREFIX = "synclip_clipboard_";
var IDS_KEY = "synclip_ids";
var HISTORY_SIZE = 5;

/**
 * Save the given content to the sync clipboard
 * @param content Content to save
 * @param callback
 */
function saveNewClipboard(content, callback) {
    console.log("Saving new clipboard");
    // Get unique client id to mark who sent the clipboard
    chrome.instanceID.getID(function(id) {
        if (chrome.runtime.lastError) {
            console.error("Error retrieving instanceID: " + chrome.runtime.lastError.message);
            return;
        }
        // Get list of saved clipboard ids
        getClipboardIds(function (ids) {
            var nextId = 1;
            if (ids.length > 0) {
                nextId = ids[ids.length - 1] + 1;
            }
            ids.push(nextId);
            // Save new clipboard
            var clipboard = {};
            clipboard[CLIPBOARD_PREFIX + nextId] = {
                content: content,
                from: id
            };
            chrome.storage.sync.set(clipboard, function () {
                if (chrome.runtime.lastError) {
                    console.error("Error saving clipboard content: " + chrome.runtime.lastError.message);
                    return callback(chrome.runtime.lastError);
                }
                // If clipboard is full, remove oldest
                if (ids.length > HISTORY_SIZE) {
                    removeClipboardWithId(ids.shift());
                }
                // Save new clipboard ids
                saveClipboardIds(ids, callback);
            });
        });
    });
}

/**
 * Retrieves saved clipboard ids
 * @param callback Callback function to accept retrieved clipboard ids
 */
function getClipboardIds(callback) {
    var defaultIds = {};
    defaultIds[IDS_KEY] = [];
    chrome.storage.sync.get(defaultIds, function(savedIds) {
        if (chrome.runtime.lastError) {
            console.error("Error retrieving clipboard size: " + chrome.runtime.lastError.message);
            return;
        }
        callback(savedIds[IDS_KEY]);
    })
}

/**
 * Save the given clipboard ids
 * @param ids Array of ids to save
 */
function saveClipboardIds(ids, callback) {
    var idsToSave = {};
    idsToSave[IDS_KEY] = ids;
    chrome.storage.sync.set(idsToSave, function() {
        if (chrome.runtime.lastError) {
            console.error("Error saving clipboard ids: " + chrome.runtime.lastError.message);
            callback(chrome.runtime.lastError);
        }
        callback();
    })
}

/**
 * Remove the clipboard with given id
 * @param id ID of clipboard to remove
 */
function removeClipboardWithId(id) {
    chrome.storage.sync.remove(CLIPBOARD_PREFIX + id, function() {
        if (chrome.runtime.lastError) {
            console.error("Error removing clipboard: " + chrome.runtime.lastError.message);
        }
    })
}

/**
 *
 * @param id
 * @param callback
 */
function getClipboard(id, callback) {
    chrome.storage.sync.get(CLIPBOARD_PREFIX + id, function(clipboard) {
        if (chrome.runtime.lastError) {
            console.error("Error retrieving clipboard: " + chrome.runtime.lastError.message);
            return;
        }
        callback(clipboard[CLIPBOARD_PREFIX + id]);
    })
}