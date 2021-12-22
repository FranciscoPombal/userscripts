// ==UserScript==
// @name            RARBG Enhancer
// @description     Opinionated improvements to the layout and functionality of RARBG pages with a focus on usability and minimalism.
// @version         1.0.0
// @namespace       pombal.francisco@gmail.com
// @author          Francisco Pombal
// @homepageURL     https://github.com/FranciscoPombal/userscripts
// @supportURL      https://github.com/FranciscoPombal/userscripts
// @downloadURL     https://github.com/FranciscoPombal/userscripts/raw/master/userscripts/rarbg_enhancer.user.js
// @grant           GM_xmlhttpRequest
// @match           https://rarbgproxied.tld/*
// @match           https://rarbg.tld/*
// @run-at          document-end
// ==/UserScript==

"use strict";

// Clickable torrent tables in TV browser appear below these divs.
const TORRENT_INFO_TABLE_TARGETS = "div[id^=tvcontent_]";
// Custom class to identify rows modified by this script.
const MODIFIED_ROW_CLASS = "table-with-utils-col";

// Callback to call `modifyTorrentTables` when appropriate in "TV browser" pages.
const tableObserverCallback = (mutations, _) => {
    for (const mutation of mutations) {
        switch (mutation.type) {
            case 'childList':
                if (mutation.addedNodes) {
                    const addedNodes = Array.from(mutation.addedNodes);
                    const loadingElementAdded = addedNodes
                        .reduce((previousValue, currentValue) => {
                            return previousValue && currentValue.nodeType === Node.ELEMENT_NODE &&
                                currentValue.outerHTML.includes("loading.gif");
                        }, true);
                    if (loadingElementAdded) {
                        break;
                    } else {
                        modifyTorrentTables();
                    }
                }
                break;
            default:
                break;
        }
    }
};

// Callbacks for the result of the `GM_xmlhttpRequest` for the torrent details pages.
const addLinksCallbacks = {
    // Extract torrent and magnet links from the downloaded torrent details page,
    // and set them as the links for the buttons in the "Utils" column.
    onloadend: (response) => {
        const magnetLinkRegex = /magnet:\?[^"]*/gm;
        if (response.responseText.match.length) {
            const magnetLink = response.responseText.match(magnetLinkRegex)[0];
            response.context.magnet_link.href = magnetLink;
        } else {
            console.error("RARBG Enhancer (addLinksCallbacks.onloadend): response received but magnet link not found. Possible causes: rate limiting, captcha");
        }

        const torrentLinkRegex = /\/download.php.*?\.torrent/gm;
        if (response.responseText.match.length) {
            const torrentLink = response.responseText.match(torrentLinkRegex)[0];
            response.context.torrent_link.href = torrentLink;
        } else {
            console.error("RARBG Enhancer (addLinksCallbacks.onloadend): response received but torrent link not found. Possible causes: rate limiting, captcha");
        }
    },
    onabort: (response) => {
        console.error("RARBG Enhancer (addLinksCallbacks.onabort): not implemented yet! Response object:");
        console.log(response);
    },
    onerror: (response) => {
        console.error("RARBG Enhancer (addLinksCallbacks.onerror): not implemented yet! Response object:");
        console.log(response);
    },
    ontimeout: (response) => {
        console.error("RARBG Enhancer (addLinksCallbacks.ontimeout): not implemented yet! Response object:");
        console.log(response);
    },
    onload: (response) => { },
    onloadstart: (response) => { },
    onprogress: (response) => { },
    onreadystatechange: (response) => { }
};

// Splits the catalog buttons into 2, one directly for "Movies", and one for "TV shows".
const splitTopCatalogButtons = () => {
    const catalogElements = Array.from(document.querySelectorAll("tr td a[href='/catalog/']"));

    const catalogElementTop = catalogElements.find((element) => { return element.classList.contains("tdlinkfull1"); }).parentElement;
    catalogElementTop.firstElementChild.setAttribute("href", "/catalog/movies/");
    catalogElementTop.firstElementChild.textContent = "Catalog: Movies";
    catalogElementTop.classList.remove("selected");

    const newCatalogElementTop = catalogElementTop.cloneNode(true);

    newCatalogElementTop.firstElementChild.setAttribute("href", "/catalog/tv/");
    newCatalogElementTop.firstElementChild.textContent = "Catalog: TV";
    catalogElementTop.after(newCatalogElementTop);
};

// prepends a "Utils" column to torrent tables
const modifyTorrentTables = () => {

    // Helper predicate to find whether an element's ancestor includes a certain substring in their id.
    const ancestorIdIncludes = (element, id) => {
        if (!element) {
            return false;
        }
        if (element.id.includes(id)) {
            return true;
        }
        return ancestorIdIncludes(element.parentElement, id);
    };

    // Helper to perform the `GM_xmlhttpRequest` for the torrent details pages.
    const addLinksFromTorrentPage = (torrentPageLink, magnetLink, torrentLink) => {
        const request_params = {
            // make references to the manget link and torrent link elements available in the response callback.
            context: { magnet_link: magnetLink, torrent_link: torrentLink },
            method: "GET",
            onloadend: addLinksCallbacks.onloadend,
            onabort: addLinksCallbacks.onabort,
            onerror: addLinksCallbacks.onerror,
            onload: addLinksCallbacks.onload,
            onloadstart: addLinksCallbacks.onloadstart,
            onprogress: addLinksCallbacks.onprogress,
            onreadystatechange: addLinksCallbacks.onreadystatechange,
            ontimeout: addLinksCallbacks.ontimeout,
            url: torrentPageLink,
        };
        // TODO: do something with the result?
        const request_result = GM_xmlhttpRequest(request_params);
    };

    // Get table rows of the type we want, but filter the ones we have already modified, to prevent adding the new column again.
    // This is only relevant for the TV browser pages.
    const tableRows = Array.from(document.querySelectorAll(".lista2"))
        .filter((row) => { return !row.classList.contains(MODIFIED_ROW_CLASS); });

    // Do nothing if this page does not have a regular torrent table.
    if (!tableRows.length) {
        return;
    }
    if (ancestorIdIncludes(tableRows[0], "news")) {
        return;
    }

    // Add the table header cell of the new table column
    const tableHeaderRow = tableRows[0].previousElementSibling;
    const utilsColumnCellHeaderCell = document.createElement("td");
    utilsColumnCellHeaderCell.textContent = "Utils";
    utilsColumnCellHeaderCell.className = "header6 header40";
    utilsColumnCellHeaderCell.style["width"] = "150px";
    tableHeaderRow.prepend(utilsColumnCellHeaderCell);

    // Add all remaining cells of the new table column.
    for (const tableRow of tableRows) {

        // mMrk table rows that we have already modified.
        tableRow.classList.add(MODIFIED_ROW_CLASS);

        // Create and add the new column to the table.
        const utilsColumnCell = document.createElement("td");
        utilsColumnCell.className = "lista";
        utilsColumnCell.style["width"] = "150px";
        tableRow.prepend(utilsColumnCell);

        // Create flexbox container that will hold the links.
        const wrapperDiv = document.createElement("div");
        wrapperDiv.style["display"] = "flex";
        wrapperDiv.style["justify-content"] = "space-evenly";
        wrapperDiv.style["margin"] = "0px 5px 0px 5px";
        wrapperDiv.style["column-gap"] = "1em";
        wrapperDiv.style["max-width"] = "130px";
        wrapperDiv.style["flex-wrap"] = "wrap";

        // Add the download buttons for torrent and magnet links that will be fetched asynchronously.
        const torrentPageLink = tableRow.querySelector("a[href^='/torrent/'").href;
        const magnetLinkElement = document.createElement("a");
        const torrentLinkElement = document.createElement("a");

        // Only perform requests on mouse over the div with the download icons to prevent triggering the site's rate limiting.
        // Arrow function syntax has no "this" context, so we must use this syntax.
        wrapperDiv.onmouseover = function () {
            addLinksFromTorrentPage(torrentPageLink, magnetLinkElement, torrentLinkElement);
            this.onmouseover = null; // ensure this is only done once per element
        };

        magnetLinkElement.textContent = "🧲";
        torrentLinkElement.textContent = "⮋";
        wrapperDiv.appendChild(magnetLinkElement);
        wrapperDiv.appendChild(torrentLinkElement);

        // Add IMDB search and external links if possible.
        // Not all torrents in a table are Movies/TV shows with an IMDB page.
        const searchByIMDB = tableRow.querySelector("a[href^='/torrents.php?imdb=']");
        if (searchByIMDB) {
            const externalIMDBLink = document.createElement("a");
            externalIMDBLink.textContent = "IMDB⬈";
            const ttRe = /.*imdb=(?<ttid>tt[0-9]+).*/;
            const IMDBTitleUrlPrefix = "https://www.imdb.com/title/";
            const ttMatch = searchByIMDB.search.match(ttRe);
            externalIMDBLink.href = IMDBTitleUrlPrefix + ttMatch.groups.ttid;
            wrapperDiv.appendChild(externalIMDBLink);

            const searchByIMDBLink = searchByIMDB.cloneNode(true);
            searchByIMDBLink.textContent = "IMDB🔎";
            searchByIMDB.remove();
            wrapperDiv.appendChild(searchByIMDBLink);
        }

        // Add the div flexbox holding all the links to the new column.
        utilsColumnCell.appendChild(wrapperDiv);
    }
};

// Removes certain site elements.
const removeBloat = () => {

    // Remove useless stuff at the top of the page.
    const firstTableRowElements = Array.from(document.querySelector("tr").children);
    firstTableRowElements
        .filter((candidateElement) => { return !candidateElement.innerHTML.includes("torrents.php"); })
        .forEach((element) => { element.remove(); });

    // Remove recommended torrents in the main search page + misc empty elements at bottom.
    const maybeRecommendedTorrents = document.querySelector(".lista-rounded > tbody > tr > td > div > table");
    if (maybeRecommendedTorrents.querySelector("tr > td.lista > a[href^='/torrent/'] > img")) {
        maybeRecommendedTorrents.remove();
    }
    const blankElements = Array.from(document.querySelectorAll(".block"));
    blankElements.forEach((blankElement) => { blankElement.parentElement.remove(); });

    // Remove remaining useless stuff at the bottom of the page.
    const emptyBottomDivs = Array.from(document.querySelectorAll("body > div"));
    emptyBottomDivs.forEach((emptyBottomDiv) => { emptyBottomDiv.remove(); });

    // Remove useless table entries in the torrent details page.
    const entriesToRemoveTextContent = [
        "VPN:",
        " Poster:",
        " Others:",
        "Trailer:",
        "Rating: ",
        " Category:",
        "PG Rating:",
        "IMDB Rating:",
        "Genres:",
        "Actors:",
        "IMDB Runtime:",
        "Year:",
        "Plot:",
        "Hit&Run:",
        "Tags:",
    ];
    const entriesToRemove = Array.from(document.querySelectorAll(".lista-rounded > tbody > tr > td > div > .lista > tbody > tr > td.header2"));
    entriesToRemove
        .filter((candidateEntry) => { return entriesToRemoveTextContent.includes(candidateEntry.textContent); })
        .forEach((entryToRemove) => { entryToRemove.parentElement.remove(); });

    // Remove result preview tables in catalog entries.
    const catalogTablesResultsPreviews = Array.from(document.getElementsByClassName("catalog-post-content"));
    catalogTablesResultsPreviews.forEach((preview) => { preview.remove(); });

    // Remove the sidebar completely...
    document.querySelector("table:nth-of-type(3) > tbody > tr >td:nth-of-type(1)").remove();
    // ...and remove useless stuff from top bar
    const buttonsToRemoveHrefs = [
        "a[href='/login']",
        "a[href='/chart.php']",
        "a[href='/top10']"
    ];
    for (const href of buttonsToRemoveHrefs) {
        let rem = null;
        if (href === "a[href='/login']") {
            rem = document.querySelector(`tr td ${href}`);
        } else {
            rem = document.querySelector(`tr td ${href}.tdlinkfull1`);
        }

        if (rem) {
            rem.parentElement.remove();
        }
    }
};

// Auto-expand mediainfo, list of files and nfo sections in torrent info pages.
const expandTorrentInfos = () => {
    const infoSelectors = [
        "a[name='#exp_mediainfo']",
        "a[name='#expand']", // "Show files"
        "a[name='#exp_nfo']"
    ];

    infoSelectors
        .flatMap((selectors) => { return Array.from(document.querySelectorAll(selectors)); })
        .forEach((button) => { button.click(); });
};

// Entry point for the script.
const main = () => {

    // First, remove site elements we don't care about.
    // Doing this first simplifies the implementation of further processing.
    removeBloat();

    // This is called here once to handle statically-loaded tables in .*/torrents.php.* pages.
    modifyTorrentTables();

    splitTopCatalogButtons();

    expandTorrentInfos();

    // Set up a mutation observer to call `modifyTorrentTables` when needed to handle torrent tables in "TV browser" pages
    // that appear on click.
    const observer = new MutationObserver(tableObserverCallback);
    const observerTargetsForTable = Array.from(document.querySelectorAll(TORRENT_INFO_TABLE_TARGETS));
    observerTargetsForTable.forEach((target) => {
        // The `subtree` option not needed, since our target is the direct parent of the subtree we want to manipulate
        const options = { childList: true };
        observer.observe(target, options);
    });
};

main();
