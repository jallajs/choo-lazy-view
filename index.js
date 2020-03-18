module.exports = lazy
module.exports.view = view
module.exports.store = store

function lazy () {
  if (arguments.length === 3) return store.apply(undefined, arguments)
  else return view.apply(undefined, arguments)
}

function view (load, loader) {
  var init = promisify(load)
  var promise

  return function proxy (state, emit) {
    if (proxy.render) return proxy.render.call(this, state, emit)

    if (!promise) {
      promise = init().then(function (render) {
        // asynchronously render view to account for nested prefetches
        if (typeof window === 'undefined') render(state, emit)
        proxy.render = render
        return render
      })
      emit('lazy:load', promise)
    }

    if (typeof loader === 'function') return loader(state, emit)

    // assuming app has been provided initialState by server side render
    var selector = state.selector
    if (typeof window === 'undefined') {
      // eslint-disable-next-line no-new-wrappers
      var str = new String()
      str.__encoded = true
      return str
    }
    if (typeof selector === 'string') return document.querySelector(selector)
    if (selector instanceof window.Element) return selector
    throw new Error('choo-lazy-view: loader or server side generated initialState required')
  }
}

function store (state, emitter, app) {
  state.selector = state.selector || app.selector
  emitter.on('lazy:load', function (p) {
    var prefetch = state.prefetch || state._experimental_prefetch
    if (prefetch) prefetch.push(p)
    p.then(function () {
      emitter.emit('lazy:success')
    }, function (err) {
      emitter.emit('lazy:error', err)
    }).then(emitter.emit.bind(emitter, 'render'))
  })
}

// wrap callback function with promise
// fn -> fn
function promisify (fn) {
  return function () {
    return new Promise(function (resolve, reject) {
      var res = fn(function (err, value) {
        if (err) reject(err)
        else resolve(value)
      })
      if (res instanceof Promise) return res.then(resolve, reject)
    })
  }
}
