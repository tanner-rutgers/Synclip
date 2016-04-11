var CLIPBOARD_PREFIX = "clipSync_clipboard_";
var HISTORY_SIZE = 5;

var selectedHistory;

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
    var content = document.getElementById("clipboard").textContent;
    log("Saving clipboard content");
    // Get unique client id to mark who sent the clipboard
    chrome.instanceID.getID(function(id) {
        if (chrome.runtime.lastError) {
            error("Error retrieving instanceID: " + chrome.runtime.lastError.message);
            return;
        }
        // Get list of saved clipboard ids
        backgroundPage.getClipboardIds(function(ids) {
            var nextId = 1;
            if (ids.length > 0) {
                nextId = ids[ids.length - 1] + 1;
            }
            ids.push(nextId);
            // If clipboard is full, remove oldest
            if (ids.length > HISTORY_SIZE) {
                backgroundPage.removeClipboardWithId(ids.shift());
            }
            // Save new clipboard
            var clipboard = {};
            clipboard[CLIPBOARD_PREFIX + nextId] = {
                content: content,
                from: id
            };
            log("Saving clipboard " + (CLIPBOARD_PREFIX + nextId));
            chrome.storage.sync.set(clipboard, function() {
                if (chrome.runtime.lastError) {
                    error("Error saving clipboard content: " + chrome.runtime.lastError.message);
                    return;
                }
                // Notify that we saved.
                log('Saved clipboard with id: ' + nextId);
                // Save new clipboard ids
                backgroundPage.saveClipboardIds(ids, function() {
                    backgroundPage.loadHistory(function() {
                        showHistory();
                        loadCarousel();
                    });
                });
            });
        })
    });
}

/**
 * Retrieves clipboard content
 * @param callback Callback function to accept retrieved content
 */
function showClipboardContent() {
    log("Retrieving and showing content from client clipboard");
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
 * Retrieves and shows clipboard history
 */
function showHistory() {
    log("Retrieving and showing clipboard history");
    var ul = document.getElementById("historyList");
    var history = backgroundPage.getLoadedHistory();
    if (history.length <= 0) {
        document.getElementById("noHistory").hidden = false;
        document.getElementById("history").hidden = true;
    } else {
        document.getElementById("noHistory").hidden = true;
        document.getElementById("history").hidden = false;
        ul.innerHTML = '';
        for (var i = 0; i < history.length; i++) {
            var li = document.createElement("li");
            li.appendChild(document.createTextNode(history[i].content));
            if (i == history.length - 1) {
                li.classList.add('current');
            }
            ul.appendChild(li);
        }
    }
}

/**
 * Sets up history carousel and functions
 */
function loadCarousel() {
    var carousel = document.getElementById("carousel");
    var prev = document.getElementById("prev");
    var next = document.getElementById("next");
    var items = carousel.querySelectorAll('.content li');
    var counter = 0;
    var amount = items.length;
    var current = items[0];
    for (var i = 0; i < amount; ++i) {
        if (items[i].classList.contains('current')) {
            current = items[i];
            counter = i;
            break;
        }
    }
    function navigate(direction) {
        current && current.classList.remove('current');
        counter += direction;
        if (counter <= 0) {
            counter = 0;
            prev.disabled = true;
        } else {
            prev.disabled = false;
        }
        if (counter >= amount - 1) {
            counter = amount - 1;
            next.disabled = true;
        } else {
            next.disabled = false;
        }
        current = items[counter];
        if (current) {
            current.classList.add('current');
            selectedHistory = current.textContent;
        }
    }
    next.addEventListener('click', function(ev) {
        navigate(1);
    });
    prev.addEventListener('click', function(ev) {
        navigate(-1);
    });
    if (current) {
        current.classList.add('current');
        selectedHistory = current.textContent;
    }
    navigate(0);
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
    document.getElementById("historyForm").addEventListener("submit", function(event) {
        event.preventDefault();
        backgroundPage.copyToClipboard(selectedHistory);
    });
    showClipboardContent();
    showHistory();
    loadCarousel();
});