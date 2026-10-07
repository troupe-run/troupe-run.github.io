# Contributing to troupe.run

Thanks for helping. This repo is the troupe.run website and docs.

## Fixing or improving a docs page

Every docs page has an **Improve this page** link that opens its source here. If you don't have write access,
GitHub makes a fork and a pull request for you.

## Running it locally

- Node 22 or later, then `npm install`.
- `npm run dev` serves the site at http://localhost:4321.
- `npm run test:unit` and `npm run test:e2e` run the tests. The e2e suite builds the site first.
- Brand images are rendered from `brand/`. If you change anything there, run `npm run assets:render` and commit
  the results. CI checks they match.

## Licensing of contributions

Contributions to this repo are accepted under its own licences: MIT for code (`LICENSE`) and CC BY 4.0 for
content (`LICENSE-CONTENT`). There's no separate agreement to sign. troupe's product repo will require a
contributor licence agreement when it's published; this site does not.

The troupe name, logo, mark and characters are trademarks of HPS.GD PTY LTD and aren't covered by either
licence.
