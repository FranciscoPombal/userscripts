// ==UserScript==
// @name           Hacker News Enhancer
// @description    Dark theme for Hacker News
// @version        1.0.0
// @namespace      pombal.francisco@gmail.com
// @author         Francisco Pombal
// @match          https://news.ycombinator.com/*
// @homepageURL    https://github.com/FranciscoPombal/userscripts
// @supportURL     https://github.com/FranciscoPombal/userscripts
// @downloadURL    https://github.com/FranciscoPombal/userscripts/raw/master/userscripts/hacker_news_enhancer.user.js
// @grant          GM_addStyle
// @run-at         document-end
// ==/UserScript==

"use strict";

// Entry point for the script.
const main = () => {
    // dark theme colors based on the original news.css
    const news_css = `
body {
    background-color: #121212;
}

/* main content area */
#hnmain {
    background-color: #2c2c2c
}

/* text input fields */
input,
textarea {
    background-color: #2c2c2c;
    color: rgb(205, 217, 229);
}

/* general link color settings */
a:link {
    color: rgb(205, 217, 229);
}

a:visited {
    color: #828282;
}

/* comment content colors */
.comment a:link,
.comment a:visited {
    text-decoration: underline;
}

.c00,
.c00 a:visited {
    color: #828282;
}

.c5a,
.c5a a:visited {
    color: #828282;
}

.c73,
.c73 a:visited {
    color: #828282;
}

.c82,
.c82 a:visited {
    color: #828282;
}

.c88,
.c88 a:visited {
    color: #828282;
}

.c9c,
.c9c a:visited {
    color: #828282;
}

.cae,
.cae a:visited {
    color: #828282;
}

.cbe,
.cbe a:visited {
    color: #828282;
}

.cce,
.cce a:visited {
    color: #828282;
}

.cdd,
.cdd a:visited {
    color: #828282;
}

.c00,
.c00 a:link {
    color: rgb(205, 217, 229);
}

.c5a,
.c5a a:link {
    color: rgb(205, 217, 229);
}

.c73,
.c73 a:link {
    color: rgb(205, 217, 229);
}

.c82,
.c82 a:link {
    color: rgb(205, 217, 229);
}

.c88,
.c88 a:link {
    color: rgb(205, 217, 229);
}

.c9c,
.c9c a:link {
    color: rgb(205, 217, 229);
}

.cae,
.cae a:link {
    color: rgb(205, 217, 229);
}

.cbe,
.cbe a:link {
    color: rgb(205, 217, 229);
}

.cce,
.cce a:link {
    color: rgb(205, 217, 229);
}

.cdd,
.cdd a:link {
    color: rgb(205, 217, 229);
}


/* navigation links on top of the page */
.pagetop a:visited,
.pagetop a:link {
    color: #000000;
}

.pagetop a:hover {
    text-decoration: underline;
}

/* color + underline on hover for comment info and subtext below title (points, OP, date, ...) */
.subtext a:link,
.subtext a:visited {
    color: #828282;
}

.subtext a:hover {
    text-decoration: underline;
}

.comhead a:link,
.subtext a:visited {
    color: #828282;
}

.comhead a:hover {
    text-decoration: underline;
}
`;

    GM_addStyle(news_css);
};

main();
