var pull = require('pull-stream')
var human = require('human-time')
var sbot = require('./scuttlebot')
var hyperscroll = require('hyperscroll')
var More = require('pull-more')
var stream = require('hyperloadmore/stream')
var h = require('hyperscript')
var render = require('./render')
var ref = require('ssb-ref')

var Next = require('pull-next-query')

var config = require('./config')()

var tools = require('./tools')
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

var mentionsStream = function () {
  var content = h('div.content')

  var screen = document.getElementById('screen')

  screen.appendChild(hyperscroll(content))

  function createStream (opts) {
    return pull(
      Next(sbot.backlinks, opts, ['value', 'timestamp']),
      pull.map(function (msg) {
        return render(msg)
      })
    )
  }

  pull(
    createStream({
      limit: 10,
      reverse: true, 
      live: false,
      query: [{$filter: {dest: id}}]
    }),
    stream.bottom(content)
  )

    pull(
    createStream({
      limit: 10,
      old: false,
      live: true,
      query: [{$filter: {dest: id}}]
    }),
    stream.top(content)
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

    var name = avatar.name(src)

    var avatars = h('div.avatars', 
      h('a', {href: '#' + src},
        h('span.avatar--medium', avatar.image(src)),
        name
      )
    )
    
    pull(
      sbot.userStream({id: src, reverse: false, limit: 1}),
      pull.drain(function (msg) { 
        var howlong = h('span', ' arrived ', human(new Date(msg.value.timestamp)))
        avatars.appendChild(howlong)
        console.log(msg)
      })
    )

    var buttons = h('div.buttons')
   
    profile.firstChild.appendChild(avatars)
    profile.firstChild.appendChild(buttons)
    buttons.appendChild(tools.mute(src))

    var writeMessage = h('button.btn', 'Public message ' + name.textContent, {
      onclick: function () {
        opts = {}
        opts.type = 'post'
        opts.mentions = '[' + name.textContent + '](' + src + ')'
        var composer = h('div#composer', h('div.message', compose(opts)))
        profile.appendChild(composer)
      }
    })

    var writePrivate = h('button.btn', 'Private message ' + name.textContent, {
      onclick: function () {
        opts = {}
        opts.type = 'post'
        opts.mentions = '[' + name.textContent + '](' + src + ')'
        opts.recps = [src, id]
        var composer = h('div#composer', h('div.message', compose(opts)))
        profile.appendChild(composer)
      }
    })
 
    buttons.appendChild(writeMessage)
    buttons.appendChild(writePrivate)
    buttons.appendChild(tools.follow(src))
    
    profile.firstChild.appendChild(tools.getFollowing(src))
    profile.firstChild.appendChild(tools.getFollowers(src))

}

var msgThread = function (src) {

  var content = h('div.content')
  var screen = document.getElementById('screen')
  screen.appendChild(hyperscroll(content))

  pull(
    sbot.query({query: [{$filter: { value: { content: {root: src}, timestamp: { $gt: 1 }}}}], live: true}),
    pull.drain(function (msg) {
      if (msg.value) {
        content.appendChild(render(msg))
      }
    }) 
  )

  sbot.get(src, function (err, data) {
    if (err) {console.log('could not find message')}
    data.value = data
    data.key = src
    console.log(data)
    var rootMsg = render(data)

    if (content.firstChild) {
      content.insertBefore(rootMsg, content.firstChild)
    } else {
      content.appendChild(rootMsg)
    }
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

function everythingStream () {

  var screen = document.getElementById('screen')
  var content = h('div.content')

  screen.appendChild(hyperscroll(content))

  function createStream (opts) {
    return pull(
      Next(sbot.query, opts, ['value', 'timestamp']),
      pull.map(function (msg) {
        if (msg.value) {
          return render(msg)
        }
      })
    )
  }

  pull(
    createStream({
      limit: 10,
      reverse: true,
      live: false,
      query: [{$filter: { value: { timestamp: { $gt: 0 }}}}]    
    }),
    stream.bottom(content)
  )

  pull(
    createStream({
      limit: 10,
      old: false,
      live: true,
      query: [{$filter: { value: { timestamp: { $gt: 0 }}}}]
    }),
    stream.top(content)
  )
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
  } else if (src == 'queue') {
    mentionsStream()
  } else if (src == 'about') {
    about()
  } else if (src == 'edit') {
    edit()
  } else if (src == 'key') {
    keyPage()
  } else {
    everythingStream()
  }
}
