# node-lambda-inspector

## Webtask.io setup


### Overview

This profiler will also work with Auth0's [webtask.io](https://webtask.io/).
Webtask expects a single Javascript file to be provided. We can work around this
by utilizing another Auth0 project,
[webtask-bundle](https://github.com/auth0/webtask-bundle).

### Setup

You can install `webtask-bundle` with `npm`:

```
$ npm i -g webtask-bundle
```

### Usage

Assuming you are in the root of this repository, you can run:

```
$ wt-bundle --output ./webtask-profiler.js ./webtask.js
Bundle successfully written to `./webtask-profiler.js`
$ wt create webtask-profiler.js
Webtask created

You can access your webtask at the following url:

https://wt-0ad02e9d22fed48c956fa4d6b11a93d3-0.run.webtask.io/webtask-profiler
```
