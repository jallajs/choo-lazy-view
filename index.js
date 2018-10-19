var assert = require('assert')
var Component = require('nanocomponent')

module.exports = LazyView

function LazyView (id, state, emitter, view) {
  Component.call(this, id)
}

LazyView.create = function (fn, loader) {
  assert(typeof fn === 'function', 'choo-lazy-view: fn should be a function')
  fn = promisify(fn)

  var Self = this
  var id = 'view-' + Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)

  return function (state, emit) {
    var cached = state.cache(Self, id)

    if (!cached.view) {
      emit('choo-lazy-view:fetch', id)
      var promise = fn(function (err, view) {
        if (err) return emit('choo-lazy-view:error', err)
        emit('choo-lazy-view:done', id, view)
        cached.view = view
        emit('render')
      })

      var prefetch = state.prefetch || state._experimental_prefetch
      if (prefetch) {
        promise = promise.then(function (view) {
          // account for view returning a promise to extend the prefetch queue
          return cached.render(state, emit)
        })
        prefetch.push(promise)
        return promise
      }
    }

    if (cached.view) return cached.render(state, emit)
    if (typeof loader === 'function') return loader(state, emit)
    if (loader) return loader

    assert(typeof window !== 'undefined', 'choo-lazy-view: loader is required when not using prefetch')
    if (typeof Self.selector === 'string') return document.querySelector(Self.selector)
    if (Self.selector instanceof window.Element) return Self.selector
    assert.fail('choo-lazy-view: could not mount loader')
  }
}

LazyView.mount = function (app, selector) {
  this.selector = selector
  return app.mount(selector)
}

LazyView.prototype = Object.create(Component.prototype)
LazyView.prototype.constructor = LazyView

LazyView.prototype.update = function () {
  return true
}

LazyView.prototype.createElement = function (state, emit) {
  assert(this.view, 'choo-lazy-view: cannot render without view')
  return this.view(state, emit)
}

// wrap callback function with promise
// fn -> fn
function promisify (fn) {
  return function (cb) {
    return new Promise(function (resolve, reject) {
      var res = fn(function (err, value) {
        if (err) reject(err)
        else resolve(value)
      })
      if (res instanceof Promise) return res.then(resolve, reject)
    }).then(done.bind(null, null), done)

    function done (err, res) {
      if (typeof cb === 'function') cb(err, res)
      if (err) throw err
      else return res
    }
  }
}
