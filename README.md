# choo-lazy-view
[![stability experimental][stability-badge]][stability-link]
[![npm version][version-badge]][npm-link]
[![build status][travis-badge]][travis-link]
[![downloads][downloads-badge]][npm-link]
[![js-standard-style][standard-badge]][standard-link]

Lazily load views as the router invokes them. Works great with dynamic import or
[split-require][split-require] but should work with any software with a promise
or callback interface.

## Usage
```javascript
var splitRequire = require('split-require')
var LazyView = require('choo-lazy-view')
var html = require('choo/html')
var choo = require('choo')

var app = choo()

app.route('/', main)

// using dynamic import
app.route('/some-page', LazyView.create(() => import('./a')))

// or using split-require
app.route('/another-page', LazyView.create((cb) => splitRequire('./b', cb)))

module.exports = LazyView.mount(app, 'body')

function main () {
  return html`
    <body class="Home">
      <h1>home</h1>
      <a href="/a">a</a><br>
      <a href="/b">b</a>
    </body>
  `
}
```

## API
The module exposes a [Nanocomponent][nanocomponent] class with two static
methods which are used for wrapping your views and `choo.mount`.

### `LazyView.create(callback, loader?)`
Accepts a callback and an optional loader view. The callback will be invoked
when the returned function is called upon by the router. The callback, in turn,
should load the required view and relay it's response (or error) back to the
caller. This can be done either with a `Promise` or with the supplied callback.

```javascript
// using promise
app.route('/my-page', LazyView.create(function () {
  return fetchViewPromise()
}))

// using the callback
app.route('/another-page', LazyView.create(function (callback) {
  fetchViewCallback(callback)
}))
```

The second argument is optional and should be a function or a DOM node which
will be displayed while loading. By default, the node used to mount the
application in the DOM is used as loader (meaning the view remains unchanged
while loading).

```javascript
app.route('/a', LazyView.create(
  () => import('./my-view'),
  (state, emit) => html`<body>Loading view…</body>`
))
```

### `LazyView.mount(app, selector)`
Wrapper function for `app.mount` which stores the selector internally to use as
fallback loader while fetching views.

```diff
- module.exports = app.mount('body')
+ module.exports = LazyView.mount(app, 'body')
```

### Extending LazyView
You may extend on the LazyView component to add a shared framework wrapper, e.g.
a header and footer.

```javascript
// components/view/index.js
var html = require('choo/html')
var LazyView = require('choo-lazy-view')
var Header = require('../header')
var Footer = require('../footer')

module.exports = class View extends LazyView {
  createElement (state, emit) {
    return html`
      <body>
        ${state.cache(Header, 'header').render()}
        ${super.createElement(state, emit)}
        ${state.cache(Footer, 'footer').render()}
      </body>
    `
  }
}
```

```javascript
// index.js
var choo = require('choo')
var View = require('./components/view')

var app = choo()

app.route('/', View.create(() => import('./views/home')))

module.exports = View.mount(app, 'body')
```

### Events
Events are namespaced under `choo-lazy-view` and emitted when loading views.

#### `choo-lazy-view:fetch`
When fetching a view.

#### `choo-lazy-view:done`
When the view has been fetched and is about to rerender.

#### `choo-lazy-view:error`
When the view fails to load.

[choo]: https://github.com/choojs/choo
[nanocomponent]: https://github.com/choojs/nanocomponent
[split-require]: https://github.com/goto-bus-stop/split-require

[stability-badge]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[stability-link]: https://nodejs.org/api/documentation.html#documentation_stability_index
[version-badge]: https://img.shields.io/npm/v/choo-lazy-view.svg?style=flat-square
[npm-link]: https://npmjs.org/package/choo-lazy-view
[travis-badge]: https://img.shields.io/travis/jallajs/choo-lazy-view/master.svg?style=flat-square
[travis-link]: https://travis-ci.org/jallajs/choo-lazy-view
[downloads-badge]: http://img.shields.io/npm/dm/choo-lazy-view.svg?style=flat-square
[standard-badge]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-link]: https://github.com/feross/standard
