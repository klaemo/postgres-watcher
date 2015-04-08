# postgres-watcher
[![NPM](https://nodei.co/npm/postgres-watcher.png)](https://nodei.co/npm/postgres-watcher/)

Watches your PostgreSQL DB for changes. Before using this module you need to set up some triggers, for example with [postgres-triggers](https://www.npmjs.com/package/postgres-triggers).

Heavily inspired by [this blog post](https://blog.andyet.com/2015/04/06/postgres-pubsub-with-json) by [@fritzy](https://github.com/fritzy).

**This module is in its early stages. Feedback and PRs welcome!**
**Note**: io.js only for now!

## Install

```
npm i postgres-watcher
```

## Usage (API)

This module is basically an event emitter.

```javascript
const Watcher = require('postgres-watcher')
const watcher = Watcher({
  db: 'postgres://foo@localhost:5432/db',
  channel: 'table_update' // optional
})

// listen for changes
watcher.on('change', function (change) {
  console.log(change) // { id: 1, type: 'INSERT', table: 'foo', ... }
})

watcher.on('error', console.error.bind(console))

// start watching, callback is optional
watcher.start(function(err) {
  if (err) throw err
  console.log(watcher.running) // true
})

// insert, update, delete rows in your db...

// stop watching, callback is optional
watcher.stop(function () {})
```

## TODO

there is certainly stuff to do ;-)

## Tests

You need to give it a database connection string to be able to run the tests.
```
POSTGRES=postgres://postgres@localhost:5432/postgres npm test
```

## License
MIT
