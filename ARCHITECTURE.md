# Architecture

The design of all of these userscripts follows these general principles:

1. Preform simple, static DOM transformations/manipulations as much as possible to achieve the desired result.

2. Preform the smallest possible number of operations to achieve the desired result.

3. Refer to the site's original DOM elements in the most explicit, unambiguous and specific way possible.

4. If dynamic manipulation is necessary, use a `MutationObserver` for that, but still try to follow 2 and 3 as much as possible.

5. Do as little as possible with the `MutationObserver`, and disconnect it as soon as (or, if it is) possible.

## Code style

- For variable declaration, `const` is preferred to `let` which is preferred over everything else.
- Arrow function syntax is used whenever possible.
- `"use strict";` is always used.

## Specific script details

### Google custom search buttons

Clicking the buttons simply appends `site:example.com` to the search query and repeats the search.

1. A mutation observer is set up to run a function that adds the search buttons to the target menu when that menu is shown.

2. The function that adds the custom search buttons simply adds to said menu some labels with links. These links have appropriately set query parameters to make it so that the result of pressing them is repeating the search with `site:example.com` appended to the search query.

    Since the mutation observer's code only needs to be run once, the observer is disconnected after its first run.

### Google custom time periods

This works very similarly to the previous script.

### Google images resolution info

Same as above.

### RARBG enhancer

1. A function is called to remove any elements we don't find useful.

    This is best done as the very first step, since it potentially simplifies the remaining logic.

2. A function is called to add the "Utils" column to any "torrent table" that is displayed after the document has loaded.

    If a page does not contain such a table, the function does nothing.

3. A function is called to split the catalog buttons.

    This is applicable in every page, and need not be done exactly at this time.

4. A function is called to expand the `mediainfo`, `files`, and `nfo` detail sections in torrent detail pages.

    In other pages, this function does nothing.

5. A mutation observer is set up to call the function that adds the "Utils" column to torrent tables whenever torrent tables are shown in "TV browser pages".
