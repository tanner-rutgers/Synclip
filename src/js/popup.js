var selectedHistory;

function showError(message) {
    document.getElementById("error").style.display = "block";
    document.getElementById("errorMessage").textContent = message;
}

function resetError() {
    document.getElementById("errorMessage").textContent = "";
    document.getElementById("error").style.display = "none";
}

/**
 * Saves given content to file sync
 * @param content String content to publish
 */
function sendClipboard() {
    var content = document.getElementById("clipboard").textContent;
    chrome.runtime.getBackgroundPage(function(backgroundPage) {
        backgroundPage.saveClipboard(content, function(error) {
            if (error) {
                showError("Error syncing clipboard");
            } else {
                resetError();
                showHistory();
            }
        });
    })
}

/**
 * Retrieves and shows clipboard content
 * @param callback Callback function to accept retrieved content
 */
function showClientClipboard() {
    chrome.runtime.getBackgroundPage(function(backgroundPage) {
       backgroundPage.getClientClipboard(function(content) {
           populateClipboardUI(content);
       });
    });
}

/**
 * Populate clipboard content in Clipboard tab
 * @param value Value to populate
 */
function populateClipboardUI(value) {
    document.getElementById('clipboard').textContent = value;
    document.getElementById('sync').style.display = "block";
    resetError();
}

/**
 * Retrieves and shows clipboard history
 */
function showHistory() {
    console.log("showHistory called");
    var ul = document.getElementById("historyList");
    chrome.runtime.getBackgroundPage(function(backgroundPage) {
        backgroundPage.loadHistory(function(history) {
            console.log("after background loadHistory");
            console.log(history);
            if (history.length <= 0) {
                document.getElementById("noHistory").style.display = "block";
                document.getElementById("history").style.display = "none";
            } else {
                document.getElementById("noHistory").style.display = "none";
                document.getElementById("history").style.display = "block";
                ul.innerHTML = '';
                for (var i = 0; i < history.length; i++) {
                    var li = document.createElement("li");
                    li.appendChild(document.createTextNode(history[i].c));
                    if (i == history.length - 1) {
                        li.classList.add('current');
                    }
                    ul.appendChild(li);
                }
            }
            loadCarousel();
        });
    });
}

/**
 * Clear history
 * @param callback
 */
function clearHistory(callback) {
    chrome.runtime.getBackgroundPage(function(backgroundPage) {
        backgroundPage.clearClipboard(function() {
            callback();
        });
    })
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
 * Perfom initialization once popup is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Add submit listener to clipboard sync
    document.getElementById("clipboardForm").addEventListener("submit", function(event) {
        event.preventDefault();
        sendClipboard();
    });
    // Add submit listener to history copy
    document.getElementById("historyForm").addEventListener("submit", function(event) {
        event.preventDefault();
        chrome.runtime.getBackgroundPage(function(backgroundPage) {
            backgroundPage.copyToClipboard(selectedHistory);
            populateClipboardUI(selectedHistory);
        });
    });
    // Add click listener to history tab
    document.getElementById("historyTabLink").addEventListener("click", function(event) {
       showHistory();
    });
    // Add click listener to help links
    var helpLinks = document.querySelectorAll(".help");
    for (var i = 0; i < helpLinks.length; i++) {
        helpLinks[i].addEventListener("click", function(event) {
            event.preventDefault();
            chrome.tabs.create({url: "../pages/synclip.html#support"});
        });
    }
    // Add click listener to clear history
    document.getElementById("clearHistoryLink").addEventListener("click", function(event) {
        event.preventDefault();
        clearHistory(function() {
            showHistory();
        });
    });
    // Prevent buttons from keeping focus
    var buttons = document.getElementsByClassName("btn");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("mousedown", function(event) {
            event.preventDefault();
        })
    }
    // Populate content
    showClientClipboard();
    showHistory();
    // Reset error message
    resetError();
});

/**
 * Repopulate clipboard element on new copy
 */
document.addEventListener('copy', function() {
    var selected = window.getSelection().toString();
    populateClipboardUI(selected);
});