var pull = require('pull-stream')
var sbot = require('./scuttlebot')
var hyperscroll = require('hyperscroll')
var More = require('pull-more')
var stream = require('hyperloadmore/stream')
var h = require('hyperscript')
var render = require('./render')
var ref = require('ssb-ref')

var config = require('./config')()

var avatar = require('./avatar')
var id = require('./keys').id

var fs = require('fs')

var compose = require('./compose')

var about = function () {
  var screen = document.getElementById('screen')

  var about = require('./about')

  var content = h('div.content', about)

  screen.appendChild(hyperscroll(content))
}

var edit = function() {
  var content = h('div.content')

  var screen = document.getElementById('screen')

  screen.appendChild(hyperscroll(content))

  var nameInput = h('input', {placeholder: 'New name'})

  var locInput = h('input', {placeholder: 'New location'})

  var descInput = h('textarea', {placeholder: 'New description'})

  var editor = h('div.message',
    h('h1', 'Edit profile'),
    nameInput,
    h('button.btn.btn-primary', 'Preview', {onclick: function () {
      if(nameInput.value) {
        api.message_confirm({
          type: 'about',
          about: id,
          name: nameInput.value || undefined
        })
      }
    }}),
    h('hr'),
    locInput,
    h('button.btn.btn-primary', 'Preview', {onclick: function () {
      if(locInput.value) {
        api.message_confirm({
          type: 'loc',
          about: id,
          loc: locInput.value || undefined
        })
      }
    }}),
    h('hr'),
    descInput,
    h('button.btn.btn-primary', 'Preview', {onclick: function (){
      if(descInput.value) {
        api.message_confirm({
          type: 'description',
          about: id,
          description: descInput.value || undefined
        })
      }
    }}),
    h('hr')
  )

  content.appendChild(editor)
}

var mentionsStream = function () {
  var content = h('div.content')

  var screen = document.getElementById('screen')

  screen.appendChild(hyperscroll(content))

  function createStream (opts) {
    return pull(
      sbot.backlinks({query: [{$filter: {dest: id}}], reverse: true}),
      pull.map(function (msg) {
        if (msg.value.private == true) 
          return 'ignoring private message'
        else
          return render(msg)
      })
    )
  }

  pull(
    createStream({reverse: true, limit: 10}),
    stream.bottom(content)
  )
}

var logStream = function () {
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

var userStream = function (src) {
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


    var profile = h('div.content#profile', h('div.message'))

    if (screen.firstChild.firstChild) {
      screen.firstChild.insertBefore(profile, screen.firstChild.firstChild)
    } else {
      screen.firstChild.appendChild(profile)
    }

    var avatars = h('div.avatars', 
      h('a', {href: '#' + src},
        h('span.avatar--medium', avatar.image(src)),
        avatar.name(src)
      )
    )

    var buttons = h('div.buttons')

   
    profile.firstChild.appendChild(avatars)
    profile.firstChild.appendChild(buttons)

    if (localStorage['mute:' + src])
      var mute = h('button.btn', 'Unmute', {
        onclick: function () {
          delete localStorage['mute:' + src]
          location.reload()
        }
      })
    else
      var mute = h('button.btn', 'Mute', {
        onclick: function () {
          localStorage['mute:' + src] = true
          location.reload()
        }
      })
    
    buttons.appendChild(mute)

}

var msgThread = function(src) {
  var content = h('div.content')
  var screen = document.getElementById('screen')
  screen.appendChild(hyperscroll(content))
  sbot.get(src, function (err, data) {
    if (err) {console.log('could not find message') }
    data.value = data
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
          if (msg.value)
            content.appendChild(render(msg))
        })
      )
    })
  })
}

var keyPage = function () {
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
}


function hash () {
  return window.location.hash.substring(1)
}

module.exports = function () {
  var src = hash()

  if (ref.isFeed(src)) {
    userStream(src)
  } else if (ref.isMsg(src)) {
    msgThread(src)
  } else if (src == 'mentions') {
    mentionsStream()
  } else if (src == 'about') {
    about()
  } else if (src == 'edit') {
    edit()
  } else if (src == 'key') {
    keyPage()
  } else {
    logStream()
  }
}
