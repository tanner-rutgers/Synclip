var CLIPBOARD_PREFIX = "clipSync_clipboard_";
var IDS_KEY = "clipSync_ids";

/**
 * Retrieves saved clipboard ids
 * @param callback Callback function to accept retrieved clipboard ids
 */
function getClipboardIds(callback) {
    console.log("Retrieving clipboard ids");
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
    console.log("Saving clipboard ids");
    console.log(ids);
    var idsToSave = {};
    idsToSave[IDS_KEY] = ids;
    chrome.storage.sync.set(idsToSave, function() {
        if (chrome.runtime.lastError) {
            console.error("Error saving clipboard ids: " + chrome.runtime.lastError.message);
            return;
        }
        console.log("Saved clipboard ids");
        callback();
    })
}

/**
 * Remove the clipboard with given id
 * @param id ID of clipboard to remove
 */
function removeClipboardWithId(id) {
    console.log("Removing clipboard with id: " + id);
    chrome.storage.sync.remove(CLIPBOARD_PREFIX + id, function() {
        if (chrome.runtime.lastError) {
            console.error("Error removing clipboard: " + chrome.runtime.lastError.message);
        }
        console.log("Removed clipboard with id: " + id);
    })
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
            console.error("Error retrieving clipboard: " + chrome.runtime.lastError.message);
            return;
        }
        callback(clipboard[CLIPBOARD_PREFIX + id]);
    })
}