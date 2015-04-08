'use strict'
const pg = require('pg')

module.exports = function (opts) {
  return new Listener(opts)
}

function Listener (opts) {
  this.channel = opts.channel || 'table_update'
  this._connectionString = opts.db
  this.running = false
}

Listener.prototype = Object.create(require('events').EventEmitter.prototype)

Listener.prototype.start = function (cb) {
  const self = this
  cb = cb || function () {}

  pg.connect(this._connectionString, function(err, client) {
    if (err) return cb(err)

    self.client = client

    // listen for notification
    client.on('notification', function (msg) {
      if (msg.name === 'notification' && msg.channel === self.channel) {
        try {
          self.emit('change', JSON.parse(msg.payload))
        } catch (err) {
          self.emit('error', err)
        }
      }
    })

    client.query('LISTEN table_update', function (err2) {
      if (err2) return cb(err2)
      self.running = true
      cb()
    })
  })
}

Listener.prototype.stop = function (cb) {
  const self = this
  cb = cb || function() {}

  if (!this.running || !this.client) return cb()

  this.client.query('UNLISTEN table_update', function (err2) {
    if (err2) return cb(err2)

    self.running = false

    // return client to the pool
    self.client.end()
    cb(null)
  })
}
