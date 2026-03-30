// ==UserScript==
// @name           Slayers Club news limit patcher
// @description    Fixes older articles not being available in the news list or available for sharing (but see caveat).
// @version        1.0.0
// @namespace      pombal.francisco@gmail.com
// @author         Francisco Pombal
// @match          https://slayersclub.bethesda.tld/*
// @homepageURL    https://github.com/FranciscoPombal/userscripts
// @supportURL     https://github.com/FranciscoPombal/userscripts
// @downloadURL    https://github.com/FranciscoPombal/userscripts/raw/master/userscripts/slayers_club_news_limit_patcher.user.js
// @grant          none
// @run-at         document-start
// ==/UserScript==

"use strict";
/* CAVEAT: the sharing feature for the older articles will still only work (and the articles will only load at all) if they are accessed through the news list or the "Previous article"/"Next article" buttons in the individual article pages, not via direct link.
 *
 * This basically just hooks XMLHttpRequest.open to find and replace the `limit=500` parameter in GET requests with a higher value.
 * This works because in the website's code, even though the value for the `limit` parameter of requests for new articles (and other things) is hard-coded, the processing and display logic makes no assumptions about- and imposes no limits on- the actual number of items retrieved.
 * The new limit value may need to be bumped periodically, because the API does not seem to have a way to request "no limit" - we tried without success the values `0`, `-1`, and even removing the parameter altogether.
 * Unfortunately, like the rating-country mapping patcher userscript, this also only seems to work with `@run-at` set to `document-start`.
 */

const OLD_LIMIT_VALUE = "500"; // this is the value that the site hard-codes and can be observed in the network requests.
const NEW_LIMIT_VALUE = "666"; // this value just needs to be higher than the actual total number of news articles, which, at the time of writing, is 541.

// Takes `XMLHttpRequest.prototype.open` as argument and hooks it with our own.
// The hook itself just does some pre-processing on the arguments before forwarding everything to the original function.
const HookXmlHttpRequestOpen = (xmlHttpRequestOpen) => {
    XMLHttpRequest.prototype.open = function () {
        if (
            arguments.length >= 2 &&
            arguments[0] == "GET" &&
            arguments[1].toLowerCase().includes(`limit=${OLD_LIMIT_VALUE}`)
        ) {
            console.log(
                `[USERSCRIPT HOOK] XMLHttpRequest.open: patched GET request limit parameter from ${OLD_LIMIT_VALUE} to ${NEW_LIMIT_VALUE}.`,
            );
            arguments[1] = arguments[1].replace(`limit=${OLD_LIMIT_VALUE}`, `limit=${NEW_LIMIT_VALUE}`);
        }
        xmlHttpRequestOpen.apply(this, arguments);
    };
    console.log("Hooked `XMLHttpRequest.open`");
};

// Entry point for the script.
const main = () => {
    HookXmlHttpRequestOpen(XMLHttpRequest.prototype.open);
};

main();
