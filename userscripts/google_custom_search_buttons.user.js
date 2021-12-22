// ==UserScript==
// @name         Google custom search buttons
// @description  Adds buttons run google search queries only against specific sites
// @version      1.0.0
// @namespace    pombal.francisco@gmail.com
// @author       Francisco Pombal
// @homepageURL     https://github.com/FranciscoPombal/userscripts
// @supportURL      https://github.com/FranciscoPombal/userscripts
// @downloadURL     https://github.com/FranciscoPombal/userscripts/raw/master/userscripts/google_custom_search_buttons.user.js
// @grant        none
// @match        https://www.google.tld/search?*
// @match        https://google.tld/search?*
// @run-at       document-end
// ==/UserScript==

"use strict";

// List of custom search buttons
const customButtons = {
    "🇬 Default": "",
    "🇾 HN": "+site%3Anews.ycombinator.com",
    "👽 Reddit": "+site%3Areddit.com",
    "🟠 SO": "+site%3Astackoverflow.com",
    "🔵 SE": "+site%3Astackexchange.com",
    "🇼 Wiki (en)": "+site%3Aen.wikipedia.org",
};

// The pop-up menu we want to append items to will appear under this target parent element when we click it, so we must observe it.
// This should be as specific as possible. Fallback: use document.documentElement and use the subtree option for the mutation observer.
const TARGET_PARENT_ELEMENT = "div[id=lb]";

const createCustomSearchButton = (buttonName, buttonUrl) => {
    const link = document.createElement("a");
    link.id = "my-custom-search-button";
    link.appendChild(document.createTextNode(buttonName));

    // Hyperlink to add ' site:example.com' to the query when button is pressed
    const queryParamRegex = /q=[^&]+/g;
    const siteParamRegex = /\+site(?:%3A|\:).+\.[^&+]+/g;
    link.href = window.location.href.replace(queryParamRegex, (match) => {
        // Replaces the existing `site` flags
        return match.search(siteParamRegex) >= 0 ? match.replace(siteParamRegex, buttonUrl) : match + buttonUrl;
    });

    return link;
}

const observerCallback = (mutations, observer) => {

    // Helper function to detect if the HTML under some given element (parentElement) corresponds to that of the "More" pop-up menu.
    // So far, the most reliable method we know of to achieve this is to check that
    // there is _both_ an svg element _and_ no "/preferences?" URL fragment in the element's innerHTML.
    const containsMoreMenu = (parentElement) => {
        const needle = "<svg";
        const poison = "/preferences?";
        const hayStack = parentElement.innerHTML;

        return hayStack.includes(needle) && (!hayStack.includes(poison));
    };

    for (const mutation of mutations) {
        switch (mutation.type) {
            case 'childList':
                // First check if the stuff we need is now in the DOM.
                // Turns out Google uses the same element as the root of the HTML hierarchy for many pop-up menus,
                // so we must also check for the correct menu.
                const parentElement = document.querySelector(TARGET_PARENT_ELEMENT);
                if ((parentElement.firstChild !== null) && containsMoreMenu(parentElement)) {
                    const moreMenu = document.querySelector(TARGET_PARENT_ELEMENT).firstChild.firstChild;
                    const firstMenuItem = moreMenu.firstChild;
                    for (const customButton in customButtons) {
                        const newMenuItem = firstMenuItem.cloneNode(true);
                        // Hover-state dependent color change is handled only for the existing buttons by Google's own Javascript based on the classes
                        // of the elements. Reset the classes of our new elements to ensure our buttons are always in the non-hover state, as a compromise.
                        newMenuItem.className = "";
                        // Remove existing links that were coppied over and add our own.
                        newMenuItem.firstChild.removeChild(newMenuItem.firstChild.firstChild);
                        newMenuItem.firstChild.appendChild(createCustomSearchButton(customButton, customButtons[customButton]));
                        // Insert new buttons in order, but all before the first vanilla button.
                        firstMenuItem.parentNode.insertBefore(newMenuItem, firstMenuItem);
                    }
                    observer.disconnect(); // The code above only needs to run once, so we can immediately disconnect the observer after that.
                }
                break;
            default:
                break;
        }
    }
};

const main = () => {
    // Create a MutationObserver to run the callback function whenever
    // there is a childList mutation (i.e., child nodes added or removed) of the target parent element;
    // Then Callback adds the buttons to the appropriate child nodes.
    const observer = new MutationObserver(observerCallback);
    const observerTarget = document.querySelector(TARGET_PARENT_ELEMENT);
    const observerOptions = { childList: true }; // subtree option is not needed if our target is the direct parent of the subtree we are interested in
    observer.observe(observerTarget, observerOptions);
};

main();
