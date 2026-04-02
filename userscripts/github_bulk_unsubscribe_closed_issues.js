// ==UserScript==
// @name           GitHub Bulk Unsubscribe Closed Issues
// @description    Adds a button to check all closed/merged issues and PRs on the current GitHub subscriptions page.
// @version        1.1.0
// @namespace      pombal.francisco@gmail.com
// @author         FranciscoPombal
// @match          https://github.com/notifications/subscriptions*
// @homepageURL    https://github.com/FranciscoPombal/userscripts
// @supportURL     https://github.com/FranciscoPombal/userscripts
// @downloadURL    https://github.com/FranciscoPombal/userscripts/raw/master/userscripts/github_bulk_unsubscribe_closed_issues.user.js
// @grant          none
// ==/UserScript==

(function () {
    "use strict";

    function addButton() {
        const selectAllText = document.getElementById("select-all-subscriptions-text");

        if (!selectAllText) {
            return false;
        }

        // Check if button already exists (prevent duplicates)
        if (document.getElementById("check-closed-subscriptions-btn")) {
            return true;
        }

        // Create the button
        const button = document.createElement("button");
        button.id = "check-closed-subscriptions-btn";
        button.textContent = "Select closed/merged";
        button.type = "button";
        button.className = "btn btn-sm ml-2";
        button.style.marginLeft = "8px";

        // Add click handler
        button.addEventListener("click", function () {
            const subscriptionItems = document.querySelectorAll(".notification-thread-subscription");

            subscriptionItems.forEach((item) => {
                const isOpen = item.querySelector(".octicon-issue-opened, .octicon-git-pull-request");
                const isClosed = item.querySelector(
                    ".octicon-issue-closed, .octicon-git-pull-request-closed, .octicon-skip",
                );
                const isMerged = item.querySelector(".octicon-git-merge");

                if (!isOpen && (isClosed || isMerged)) {
                    const checkbox = item.querySelector('input[type="checkbox"][name="subscription_ids[]"]');
                    if (checkbox && !checkbox.checked) {
                        checkbox.click();
                    }
                }
            });
        });

        selectAllText.parentElement.insertBefore(button, selectAllText.nextSibling);
        return true;
    }

    // Try to add button immediately
    if (!addButton()) {
        // If element not ready, wait for it
        const observer = new MutationObserver(() => {
            if (addButton()) {
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Re-run on Turbo navigation events
    document.addEventListener("turbo:load", addButton);
    document.addEventListener("turbo:frame-load", addButton);
    document.addEventListener("turbo:reload", addButton);
    document.addEventListener("turbo:render", addButton);
})();
