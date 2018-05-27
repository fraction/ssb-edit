var pull = require('pull-stream')
var sbot = require('./scuttlebot')
var hyperscroll = require('hyperscroll')
var More = require('pull-more')
var stream = require('hyperloadmore/stream')
var h = require('hyperscript')
var render = require('./render')
var ref = require('ssb-ref')

var config = require('./config')()

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
          return render(msg)
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
        content.appendChild(render(data))
        pull(
          sbot.links({rel: 'root', dest: root, values: true, keys: true, live: true}),
          pull.drain(function (msg) {
            console.log(msg)
            if (msg.value)
              content.appendChild(render(msg))
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
  
  else if (src == 'key') {
    var screen = document.getElementById('screen')

    var importKey = h('textarea.import', {placeholder: 'Import a new public/private key', name: 'textarea', style: 'width: 97%; height: 100px;'})

    var content = h('div.content',
      h('div.message#key',
        h('h1', 'Your Key'),
        h('p', {innerHTML: 'Your public/private key is: <pre><code>' + localStorage[config.caps.shs + '/secret'] + '</code></pre>'},
        h('button.btn', {onclick: function (e){
            localStorage[config.caps.shs +'/secret'] = ''
            alert('Your public/private key has been deleted')
            e.preventDefault()
            location.hash = ""
            location.reload()
          }}, 'Delete Key')
        ),
        h('hr'),
        h('form',
          importKey,
          h('button.btn', {onclick: function (e){
            if(importKey.value) {
              localStorage[config.caps.shs + '/secret'] = importKey.value.replace(/\s+/g, ' ')
              e.preventDefault()
              alert('Your public/private key has been updated')
            }
            location.hash = ""
            location.reload()
          }}, 'Import key'),
        )
      )
    )
  
    screen.appendChild(hyperscroll(content))

  } else {
    var content = h('div.content')
    var screen = document.getElementById('screen')
    screen.appendChild(hyperscroll(content))
    function createStream (opts) {
      return pull(
        More(sbot.createLogStream, opts),
        pull.map(function (msg) {
          return render(msg)
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


