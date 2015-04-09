'use strict'
const pg = require('pg')

module.exports = function (opts) {
  return new Listener(opts)
}

function Listener (opts) {
  this.channel = opts.channel || 'table_update'
  this._connectionString = opts.db
  this.running = false
  this.filter = typeof opts.filter === 'function' ? opts.filter : () => true
}

Listener.prototype = Object.create(require('events').EventEmitter.prototype)

Listener.prototype.start = function (cb = () => {}) {
  pg.connect(this._connectionString, (err, client) => {
    if (err) return cb(err)

    this.client = client

    // listen for notification
    client.on('notification', (msg) => {
      if (msg.name === 'notification' && msg.channel === this.channel) {
        var payload
        try {
          payload = JSON.parse(msg.payload)
        } catch (err) {
          this.emit('error', err)
        }

        if (this.filter(payload)) {
          this.emit('change', payload)
        }
      }
    })

    client.query('LISTEN table_update', (err2) => {
      if (err2) return cb(err2)
      this.running = true
      cb()
    })
  })

  return this
}

Listener.prototype.stop = function (cb = () => {}) {
  if (!this.running || !this.client) return cb()

  this.client.query('UNLISTEN table_update', (err2) => {
    if (err2) return cb(err2)

    this.running = false

    // return client to the pool
    this.client.end()
    cb(null)
  })

  return this
}
