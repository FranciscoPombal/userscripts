// ==UserScript==
// @name        Slayers Club rating-country mapping patcher
// @description Fixes Slayers Club broken account login when the detected geo location is not present in the rating-country mapping returned by Bethesda's API.
// @version     1.2.0
// @namespace   pombal.francisco@gmail.com
// @author      Francisco Pombal
// @match       https://slayersclub.bethesda.tld/*
// @homepageURL    https://github.com/FranciscoPombal/userscripts
// @supportURL     https://github.com/FranciscoPombal/userscripts
// @downloadURL    https://github.com/FranciscoPombal/userscripts/raw/master/userscripts/slayers_club_rating_country_mapping_patcher.user.js
// @grant       none
// @run-at      document-start
// ==/UserScript==

/* What this does: applies a very minor patch to a very broken script on the Slayers Club website.
 * Why this is needed: an inline script in the Slayers Club website crashes in a way that renders at least one critical feature of the website unusable (account login) when it detects the user is accessing it from certain geo locations - we first observed this when trying to access it from Portugal.
 *
 * The Slayers Club website contains an inline script that at some point, has the following code (the `ratingsFromState` variable is truncated and edited, without loss of semantics):
 *
 * ```javascript
 * var bethnetAPI = bethnet(window.bnConf).then(function (api) {
 *     const { geolocation, model: { ratingCountryMapping } } = api.store.getState()
 *     const ratingFromGeolocation = geolocation && ratingCountryMapping ? ratingCountryMapping[geolocation] : 'ESRB'
 *     const ratingsFromState = [{ "ESRB": "some-image-url1" }, { "PEGI": "some-image-url2" /*  }] || []
 *     const ratingImage = ratingsFromState.length ? ratingsFromState.find(rating => rating[ratingFromGeolocation])[ratingFromGeolocation] : ''
 *
 *     // ... some other code ...
 *
 *     return api;
 * }).catch(function (err) { console.trace(err.stack); });
 * ```
 *
 * The problem lies in the callback function of the `bethnet(...)` promise:
 *
 * - In the first line of this function, some parameters fetched from the `api` object.
 *  - `geolocation` is a country code, such as "PT", for example, if the user is accessing the website from Portugal;
 *  - `ratingCountryMapping` is a mapping of country code to rating system: `{ AD: "PEGI", AE: "PEGI", ...}`;
 * - For some reason, this mapping does not include all possible entries that can be indexed by the values that `geolocation` takes, such as `PT: "PEGI"`.
 * - Thus, in the second line of the function, if `geolocation` is indeed `"PT"` or some other value is not present in this mapping, `ratingCountryMapping[geolocation]` yields undefined, so `ratingFromGeolocation` will be undefined.
 * - `ratingFromGeolocation` does default to `'ESRB'` if either `ratingCountryMapping` or `geolocation` is undefined, but in practice I could not force this condition.
 * - In the fourth line of the function, because `ratingFromGeolocation` is undefined, `ratingsFromState.find(rating => rating[ratingFromGeolocation])` will evaluate to `undefined` (whereas it should have evaluated to one of the dictionaries from `ratingsFromState`, defined on the third line).
 * Attempting to index this value, which will be `undefined` as opposed to a dictionary, causes a `TypeError`.
 * This function does not handle any potential errors at all, it simply logs a stack trace to the console for any error that might occur.
 * However, the rest of the website's code seems to assume this function always executes properly, returning the `api` object which is then assumed to not be `undefined` in other places.
 * The observable effect of this is that at least the account login feature becomes unusable.
 * In the console, uncaught `TypeError`s are logged every time the `Sign In` button is clicked, because that code path depends on objects/values that were left undefined due to the described failure, such as the aforementioned `api`.
 *
 * With the browser's debugger, placing a breakpoint on the second line of the function, executing `ratingCountryMapping["PT"] = "PEGI"` in the debugger's interactive console, and continuing execution after that is enough to solve the problem.
 *
 * This userscript is a more persistent version of that solution.
 * The first version of this script simply added add a mutation observer that appends `; ratingCountryMapping['PT'] = 'PEGI';` to the first line of the broken function described above.
 * It did so by editing the text content of the DOM node of the script this function belongs to.
 * For this to work, this userscript must be executed as early as possible.
 * Though the `document-start` value for the `@run-at` key in the Metadata block provides no guarantees that this will be executed before any other scripts, it does make it work (whereas the default value for `@run-at` does not work at all).
 *
 * The current version of this script opts instead to patch the second line of the broken function to also fallback to `'ESRB'` if `ratingCountryMapping[geolocation] === undefined`.
 * This is a better, more general solution to the problem, that will work regardless of the specific `geolocation` that is detected.
 * This version still depends on executing early enough to patch the script before it is executed.
 *
 * NOTE: We have experimented further to try to get rid of the requirement to execute early, but so far without success.
 */

"use strict";

const scriptLineToReplace =
    /const ratingFromGeolocation = geolocation && ratingCountryMapping \? ratingCountryMapping\[geolocation\] : 'ESRB'/;
const patchedScriptLine = `const ratingFromGeolocation = geolocation && ratingCountryMapping && ratingCountryMapping[geolocation] !== undefined ? ratingCountryMapping[geolocation] : 'ESRB';`;

const findAndPatchScriptCallback = (_, observer) => {
    const targetScript = Array.from(document.querySelectorAll("script")).find((el) => {
        return el.text && el.text.search(scriptLineToReplace) != -1;
    });

    console.log("Searching for broken script to patch...");

    if (targetScript) {
        targetScript.text = targetScript.text.replace(scriptLineToReplace, patchedScriptLine);
        observer.disconnect();
        console.log("Found and patched broken script!");
    }
};

// Entry point for the script.
const main = () => {
    const observer = new MutationObserver(findAndPatchScriptCallback);
    observer.observe(document.documentElement, { childList: true, subtree: true });
};

main();
