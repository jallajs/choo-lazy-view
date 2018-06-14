var assert = require('assert')
var Component = require('nanocomponent')

module.exports = LazyView

function LazyView (id, state, emitter, view) {
  Component.call(this, id)
  this.view = view || null
}

LazyView.create = function (fn, loader) {
  assert(typeof fn === 'function', 'choo-lazy-view: fn should be a function')

  var Self = this
  var id = 'view-' + Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
  var queue = this.queue = this.queue || []

  var view = null
  if (typeof window === 'undefined') {
    queue.push(fn(function (err, response) {
      if (err) assert.fail('choo-lazy-view: ' + err.message)
      view = response
    }))
  }

  return function (state, emit) {
    var cached = state.cache(Self, id, view)

    if (!cached.view) {
      emit('choo-lazy-view:fetch', id)
      fn(function (err, view) {
        if (err) return emit('choo-lazy-view:error', err)
        emit('choo-lazy-view:done', id, view)
        cached.view = view
        emit('render')
      })
    }

    if (cached.view) return cached.render(state, emit)
    if (typeof loader === 'function') return loader(state, emit)
    if (loader) return loader
    if (typeof Self.selector === 'string') return document.querySelector(Self.selector)
    if (Self.selector instanceof window.HTMLElement) return Self.selector
    assert.fail('choo-lazy-view: could not mount loader')
  }
}

LazyView.mount = function (app, selector) {
  this.selector = selector
  return Promise.all(this.queue).then(function () {
    return app.mount(selector)
  })
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
