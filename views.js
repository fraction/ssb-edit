var pull = require('pull-stream')
var sbot = require('./scuttlebot')
var hyperscroll = require('hyperscroll')
var More = require('pull-more')
var stream = require('hyperloadmore/stream')
var h = require('hyperscript')
var render = require('./render')

var compose = require('./compose')

var content = h('div.content')
function screen () {
  document.body.appendChild(h('div.screen',
    {style: {position: 'absolute', top: '0px', bottom: '0px', left: '0px', right: '0px'}},
    hyperscroll(content)
  ))
}

module.exports.logstream = function () {
  screen()

  function createStream (opts) {
    return pull(
      More(sbot.createLogStream, opts),
      pull.map(function (msg) {
        return h('div', render(msg))
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

var rawJSON = require('patchapp-raw/json')

module.exports.rawstream = function () {
  screen()

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
  screen()

  function createStream (opts) {
    return pull(
      More(sbot.userStream, opts, ['value', 'sequence']),
      pull.map(function (msg) {
        return h('div', render(msg))
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

module.exports.get = function (src) {
  screen()

  sbot.get(src, function (err, data) {
    if (err) {console.log('could not find message') } 
    data.value = data
    console.log(data)
    var root = src
    if (data.value.content.root) 
      root = data.value.content.root
    sbot.get(root, function (err, data) {
      if (err) { console.log('could not find root')}
      data.value = data
      data.key = root
      content.appendChild(h('div', render(data)))
      pull(
        sbot.links({rel: 'root', dest: root, values: true, keys: true, live: true}),
        pull.drain(function (msg) {
          console.log(msg)
          if (msg.value)
            content.appendChild(h('div', render(msg)))
        })
      )
    })
  })
} 

module.exports.compose = function () {
  screen()
  var opts = {
    "root": null,
    "type": "post"
  }
  content.appendChild(h('div.message', compose(opts)))
}
