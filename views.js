var pull = require('pull-stream')
var sbot = require('./scuttlebot')
var hyperscroll = require('hyperscroll')
var More = require('pull-more')
var stream = require('hyperloadmore/stream')
var h = require('hyperscript')
var render = require('./render')

module.exports.logstream = function () {
  var content = h('div.content')

  document.body.appendChild(h('div.screen',
    {style: {position: 'absolute', top: '0px', bottom: '0px', left: '0px', right: '0px'}},
    hyperscroll(content)
  ))

  function createStream (opts) {
    return pull(
      More(sbot.createLogStream, opts),
      pull.map(function (msg) {
        return h('div.message', render(msg))
      })
    )
  }

  pull(
    createStream({old: false, limit: 100}),
    stream.top(content)
  )

  pull(
    createStream({reverse: true, live: false, limit: 100}),
    stream.bottom(content)
  )
}

var rawJSON = require('patchapp-raw/json')

module.exports.rawstream = function () {
  var content = h('div.content')

  document.body.appendChild(h('div.screen',
    {style: {position: 'absolute', top: '0px', bottom: '0px', left: '0px', right: '0px'}},
    hyperscroll(content)
  ))

  function createStream (opts) {
    return pull(
      More(sbot.createLogStream, opts),
      pull.filter(function (data) {
        return 'string' === typeof data.value.content.text
      }),
      pull.map(function (msg) {
        return h('pre.raw__json', {id: msg.key}, rawJSON(msg))
      })
    )
  }

  pull(
    createStream({old: false, limit: 10}),
    stream.top(content)
  )

  pull(
    createStream({reverse: true, live: false, limit: 10}),
    stream.bottom(content)
  )
}

module.exports.userstream = function (src) {
  var content = h('div.content')

  document.body.appendChild(h('div.screen',
    {style: {position: 'absolute', top: '0px', bottom: '0px', left: '0px', right: '0px'}},
    hyperscroll(content)
  ))

  function createStream (opts) {
    return pull(
      More(sbot.userStream, opts, ['value', 'sequence']),
      pull.map(function (msg) {
        return h('div.message', render(msg))
      })
    )
  }

  pull(
    createStream({old: false, limit: 10, id: src}),
    stream.top(content)
  )

  pull(
    createStream({reverse: true, live: false, limit: 10, id: src}),
    stream.bottom(content)
  )

}
