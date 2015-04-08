'use strict'

const triggers = require('postgres-triggers')
const pg = require('pg')
const test = require('tape')
const Watcher = require('../')

const DB = process.env.POSTGRES

function create (client, cb) {
  client.query(`
    CREATE TABLE IF NOT EXISTS triggers_test_table1 (id bigserial primary key, name varchar(20));
    CREATE TABLE IF NOT EXISTS triggers_test_table2 (id bigserial primary key, name varchar(20));
  `, cb)
}

function clean (client, cb) {
  client.query('DROP TABLE IF EXISTS triggers_test_table1; DROP TABLE IF EXISTS triggers_test_table2;', cb)
}

test('test triggers', function (t) {
  const opts = {
    db: DB, tables: ['triggers_test_table1', 'triggers_test_table2']
  }

  const watcher = Watcher({ db: DB })

  pg.connect(opts.db, function (err, client) {
    if (err) throw err
    create(client, function (err2) {
      if (err2) throw err2

      // set up triggers
      triggers(opts, function (err4) {
        if (err4) throw err4
        t.strictEqual(watcher.running, false, 'watcher should not be running')

        var cnt = 0
        watcher.on('change', function (change) {
          t.strictEqual(typeof change, 'object', 'should get change object')

          if (++cnt === 2) {
            watcher.stop(function () {
              t.strictEqual(watcher.running, false, 'watcher should be stopped')
              clean(client, function () {
                client.end()
                t.end()
              })
            })
          }
        })

        watcher.start(function (err5) {
          if (err5) throw err5
          t.strictEqual(watcher.running, true, 'watcher should be running')
          client.query('INSERT INTO triggers_test_table1 (name) VALUES (\'foo\')')
          client.query('INSERT INTO triggers_test_table2 (name) VALUES (\'bar\')')
        })
      })
    })
  })
})
