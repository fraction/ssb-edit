var pull = require('pull-stream')
var sbot = require('./scuttlebot')
var hyperscroll = require('hyperscroll')
var More = require('pull-more')
var stream = require('hyperloadmore/stream')
var h = require('hyperscript')
var render = require('./render')
var ref = require('ssb-ref')

var fs = require('fs')

var compose = require('./compose')

function hash () {
  return window.location.hash.substring(1)
}

module.exports = function () {
  var src = hash()

  if (ref.isFeed(src)) {
    var content = h('div.content')
    var screen = document.getElementById('screen')
    screen.appendChild(hyperscroll(content))
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


  } else if (ref.isMsg(src)) {
    var content = h('div.content')
    var screen = document.getElementById('screen')
    screen.appendChild(hyperscroll(content))
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

  else if (src == 'about') {

    var screen = document.getElementById('screen')

    var about = require('./about')

    var content = h('div.content', about)

    screen.appendChild(hyperscroll(content))
  }
  else {
    var content = h('div.content')
    var screen = document.getElementById('screen')
    screen.appendChild(hyperscroll(content))
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
}


