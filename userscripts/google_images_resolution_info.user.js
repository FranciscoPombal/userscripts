// ==UserScript==
// @name            Google images resolution info
// @description     Displays image dimensions (eg. "1920 × 1080") for each thumbnail on the Google Image Search results page.
// @version         1.0.0
// @namespace       pombal.francisco@gmail.com
// @author          Francisco Pombal
// @homepageURL     https://github.com/FranciscoPombal/userscripts
// @supportURL      https://github.com/FranciscoPombal/userscripts
// @downloadURL     https://github.com/FranciscoPombal/userscripts/raw/master/userscripts/google_images_resolution_info.user.js
// @inject-into     content
// @match           https://*.google.tld/*tbm=isch*
// @run-at          document-end
// ==/UserScript==

"use strict";

const IMG_DIMS_CSS_CLASS = "img-dims";
const IMG_DIMS_CSS_CONTENT = `.${IMG_DIMS_CSS_CLASS} p {
    position: absolute;
    bottom: 0;
    right: 0;
    margin: 0;
    padding: 4px;
    color: #f1f3f4;
    background-color: rgba(0, 0, 0, .5);
    border-radius: 2px 0 0 0;
    font-family: Roboto-Medium, Roboto, Arial, sans-serif;
    font-size: 10px;
    line-height: 12px;
}`;

const addGlobalStyle = (css) => {
    const head = document.getElementsByTagName('head')[0];
    if (!head) {
        return;
    }
    const style = document.createElement('style');
    style.textContent = css;
    head.appendChild(style);
}

const addDimsDisplay = () => {
    // Find all thumbnails excluding those that already have our custom dimensions CSS class.
    const images = document.querySelectorAll(`[data-ow]:not(.${IMG_DIMS_CSS_CLASS})`);

    for (const image of images) {
        // Get image dimensions from appropriate attributes.
        const width = image.getAttribute('data-ow');
        const height = image.getAttribute('data-oh');

        // Create element with dimensions and add it to the image.
        const dimensionsElement = document.createElement("p");
        const dimensionsContent = document.createTextNode(width + " × " + height);
        dimensionsElement.appendChild(dimensionsContent);
        image.firstChild.appendChild(dimensionsElement);
        image.classList.add(IMG_DIMS_CSS_CLASS);
    }
}

// Add CSS style used for image dimensions.
addGlobalStyle(IMG_DIMS_CSS_CONTENT);

// add dimensions display to images once on document ready.
addDimsDisplay();

// Add and run MutationObserver targetting the grid containing all thumbnails.
const mutationObserver = new MutationObserver(addDimsDisplay);
const targetNode = document.querySelector('div[data-cid="GRID_STATE0"]');
mutationObserver.observe(targetNode, { childList: true, subtree: true });
