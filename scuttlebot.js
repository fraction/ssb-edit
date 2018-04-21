var pull = require('pull-stream')
var ssbKeys = require('ssb-keys')
var ref = require('ssb-ref')
var reconnect = require('pull-reconnect')

var config = require('./config')()
var createClient = require('ssb-client')
var keys = require('./keys')

var CACHE = {}

var rec = reconnect(function (isConn) {
  function notify (value) {
    isConn(value)
  }

  createClient(keys, {
    manifest: require('./manifest.json'),
    remote: config.remote,
    caps: config.caps
  }, function (err, _sbot) {
    if(err)
      return notify(err)

    sbot = _sbot
    sbot.on('closed', function () {
      sbot = null
      notify(new Error('closed'))
    })

    notify()
  })
})

module.exports = {
  createLogStream: rec.source(function (opts) {
    return pull(
      sbot.createLogStream(opts),
      pull.through(function (e) {
        CACHE[e.key] = CACHE[e.key] || e.value
      })
    )
  }),
  userStream: rec.source(function (config) {
    return pull(
      sbot.createUserStream(config),
      pull.through(function (e) {
        CACHE[e.key] = CACHE[e.key] || e.value
      })
    )
  }),
  query: rec.source(function (query) {
    return sbot.query.read(query)
  })
}

