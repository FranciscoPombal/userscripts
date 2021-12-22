// ==UserScript==
// @name         Google custom time periods
// @description  Add more time periods on Google search.
// @version      1.0.0
// @namespace    pombal.francisco@gmail.com
// @author       Francisco Pombal
// @homepageURL     https://github.com/FranciscoPombal/userscripts
// @supportURL      https://github.com/FranciscoPombal/userscripts
// @downloadURL     https://github.com/FranciscoPombal/userscripts/raw/master/userscripts/google_custom_time_periods.user.js
// @grant        none
// @match        https://www.google.tld/search?*
// @match        https://google.tld/search?*
// @run-at       document-end
// ==/UserScript==

"use strict";

const CUSTOM_PERIODS = {
    "hours": {
        "type": "toPresent",
        "queries": {
            "Past hour": "qdr:h",
            "Past 2 hours": "qdr:h2",
            "Past 6 hours": "qdr:h6",
            "Past 12 hours": "qdr:h12"
        }
    },
    "days": {
        "type": "toPresent",
        "queries": {
            "Past day": "qdr:d",
            "Past 2 days": "qdr:d2",
            "Past 3 days": "qdr:d3",
            "Past 5 days": "qdr:d5"
        }
    },
    "weeks": {
        "type": "toPresent",
        "queries": {
            "Past week": "qdr:w",
            "Past 2 weeks": "qdr:w2",
            "Past 3 weeks": "qdr:w3",
            "Past 6 weeks": "qdr:w6"
        }
    },
    "months": {
        "type": "toPresent",
        "queries": {
            "Past month": "qdr:m",
            "Past 2 months": "qdr:m2",
            "Past 3 months": "qdr:m3",
            "Past 6 months": "qdr:m6"
        }
    },
    "years": {
        "type": "toPresent",
        "queries": {
            "Past year": "qdr:y",
            "Past 2 years": "qdr:y2",
            "Past 3 years": "qdr:y3",
            "Past 5 years": "qdr:y5"
        }
    },
    "decades": {
        "type": "timePeriod",
        "queries": {
            "in the '90s": ['1/1/1990', '12/31/1999'],
            "in the '00s": ['1/1/2000', '12/31/2009'],
            "in the '10s": ['1/1/2010', '12/31/2019'],
            "in the '20s": ['1/1/2020', '12/31/2029']
        }
    },
};

// Most specific identifier for the parent element under which the element we're interested in will appear.
const TARGET_PARENT_ELEMENT = "div[id=lb]";

const modifyTimeTimePeriods = (parentElement) => {

    const timeHrefUtils = {
        customToPresentHref: (href, query) => href.replace(/qdr:[hd]/, query),
        customRangeHref: (href, from, to) => href.replace(/(qdr:)[a-z][0-9]*/, `cdr:1,cd_min:${from},cd_max:${to}`)
    };

    const timePeriodMenuItemLinkElement = parentElement.querySelector('a[href*="qdr:"]');
    const timePeriodMenuItem = timePeriodMenuItemLinkElement.parentNode.parentNode;
    const timePeriodMenu = timePeriodMenuItem.parentNode;
    // Remove all menu items except for "Any time" and "Custom interval", which are the first and last items, respectively.
    while (timePeriodMenu.children[1] !== timePeriodMenu.lastElementChild) {
        timePeriodMenu.children[1].remove();
    }

    // Create the grid layout and add it to the menu.
	const timeGrid = document.createElement("div");
	timeGrid.className = "timeGrid";
	timeGrid.style["padding"] = "0em 2em 0em 2em";
    timeGrid.style["display"] = "grid";
    timeGrid.style["gap"] = "2px";
    timeGrid.style["grid-template-columns"] = `repeat(${Object.entries(CUSTOM_PERIODS).length}, 1fr)`;
    timePeriodMenu.lastElementChild.before(timeGrid);

    // Add elements to the grid layout.
    for (const [timePeriodName, timePeriodData] of Object.entries(CUSTOM_PERIODS)) {
        const timeGroup = document.createElement("div");
        timeGroup.className = timePeriodName;
        timeGrid.appendChild(timeGroup);
        for (const [text, query] of Object.entries(timePeriodData["queries"])) {
            const linkElement = timePeriodMenuItemLinkElement.cloneNode(true);
            const linkWrapper = document.createElement("div");
            timeGroup.appendChild(linkWrapper);

            linkElement.textContent = text;
            linkElement.style["padding"] = "0px";
            linkWrapper.appendChild(linkElement);
            linkWrapper.style["padding"] = "2px 10px 2px 10px";

            if (timePeriodData["type"] === "toPresent") {
                linkElement.href = timeHrefUtils.customToPresentHref(linkElement.href, query);
            } else if (timePeriodData["type"] === "timePeriod") {
                linkElement.href = timeHrefUtils.customRangeHref(linkElement.href, query[0], query[1]);
            }
        }
    }
};

const observerCallback = (mutations, observer) => {

    const containsTimePeriodsMenu = (element) => {
        const needles = ["qdr:d", "qdr:h"];
        const hayStack = element.innerHTML;
        const poison = "<svg";
        const compatWorkaround = !hayStack.includes(poison); // Make sure we aren't working with the wrong pop-up menu
        return needles.some((needle) => { return hayStack.includes(needle); }) && compatWorkaround;
    };

    for (const mutation of mutations) {
        switch (mutation.type) {
            case 'childList':
                const parentElement = document.querySelector(TARGET_PARENT_ELEMENT);
                if ((parentElement.firstChild !== null) && containsTimePeriodsMenu(parentElement)) {
                    modifyTimeTimePeriods(parentElement);
                    observer.disconnect(); // the code above only needs to run once, so we can immediately disconnect the observer after that.
                }
                break;
            default:
                break;
        }
    }
};

const main = () => {
    const observer = new MutationObserver(observerCallback);
    const observerTarget = document.querySelector(TARGET_PARENT_ELEMENT);
    const observerOptions = { childList: true };
    observer.observe(observerTarget, observerOptions);
};

main();
