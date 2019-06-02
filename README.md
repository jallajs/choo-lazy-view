# choo-lazy-view
[![stability experimental][stability-badge]][stability-link]
[![npm version][version-badge]][npm-link]
[![build status][travis-badge]][travis-link]
[![downloads][downloads-badge]][npm-link]
[![js-standard-style][standard-badge]][standard-link]

Lazily load views as the router invokes them. Works great with dynamic import or
[split-require][split-require] but should work with any promise or callback API.

## Usage
```javascript
var lazy = require('choo-lazy-view')
var choo = require('choo')

var app = choo()

app.use(lazy)
app.route('/my-page', lazy(() => import('./views/my-page')))

module.exports = app.mount('body')
```

## API
### `app.use(lazy)`
Hook up lazy view manager to the app. The lazy view store detects [jalla][jalla]
and [bankai][bankai] prefetch (_experimental_prefetch) behaviour so that server
side rendering works just as you'd expect.

### `lazy(callback, loader?)`
Accepts a callback and an optional loader view. The callback will be invoked
when the view is called upon by the router. The callback, in turn, should load
the required view and relay it's response (or error) back to the caller. This
can be done either with a `Promise` or with a callback.

```javascript
// using promise
app.route('/my-page', lazy(() => import('./views/my-page')))

// using a callback
app.route('/another-page', lazy(function (callback) {
  fetchView(function (err, view) {
    callback(err, view)
  })
}))
```

The second argument is optional and should be a function or a DOM node which
will be displayed while loading. By default, the node used to mount the app in
the DOM is used as loader (meaning the view remains unchanged while loading).

```javascript
app.route('/a', lazy(
  () => import('./my-view'),
  (state, emit) => html`<body>Loading view…</body>`
))
```

During server side render, the store will expose the selector used by
`app.mount` on the app state and use that as the fallback loader view. If you
are not doing server side rendering and exposing the server side rendered state
as `initialState` on the client, a loader view is required. *Note: jalla does
this automatically for you.*

### Events
Events are namespaced under `lazy-view` and emitted when loading views.

#### `lazy-view:load(promise)`
When fetching a view. The argument `promise` resolves to the loaded view.

#### `lazy-view:success(view)`
When the view has been fetched, before the app will rerender. The argument
`view` is the resolved view.

#### `lazy-view:error(err)`
When the view fails to load.

## License
MIT

[choo]: https://github.com/choojs/choo
[jalla]: https://github.com/jallajs/jalla
[bankai]: https://github.com/choojs/bankai
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
