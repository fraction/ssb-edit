var pull = require('pull-stream')
var human = require('human-time')
var sbot = require('./scuttlebot')
var hyperscroll = require('hyperscroll')
var hyperfile = require('hyperfile')
var dataurl = require('dataurl-')
var More = require('pull-more')
var stream = require('hyperloadmore/stream')
var h = require('hyperscript')
var render = require('./render')
var ref = require('ssb-ref')
var client = require('ssb-client')

var Next = require('pull-next-query')

var config = require('./config')()

var tools = require('./tools')
var avatar = require('./avatar')
var id = require('./keys').id

var ssbKeys = require('ssb-keys')
var keys = require('./keys')

var checkInvite = require('./invite')

var compose = require('./compose')

var about = function () {
  var screen = document.getElementById('screen')

  var about = require('./about')

  var content = h('div.content', about)

  screen.appendChild(hyperscroll(content))
}

var privateStream = function () {
  var content = h('div.content')
  var screen = document.getElementById('screen')
  screen.appendChild(hyperscroll(content))

  function createStream (opts) {
    return pull(
      More(sbot.createLogStream, opts),
      pull.filter(function (msg) {
        return 'string' == typeof msg.value.content
      }),
      pull.filter(function (msg) {
        var unboxed = ssbKeys.unbox(msg.value.content, keys)
        if (unboxed) {
          msg.value.content = unboxed
          msg.value.private = true
          return msg
        }
      }),
      pull.map(function (msg) {
        return render(msg)
      })
    )
  }

  pull(
    createStream({old: false, limit: 1000}),
    stream.top(content)
  )

  pull(
    createStream({reverse: true, live: false, limit: 1000}),
    stream.bottom(content)
  )
}

var mentionsStream = function () {
  var content = h('div.content')

  var screen = document.getElementById('screen')

  screen.appendChild(hyperscroll(content))

  function createStream (opts) {
    return pull(
      Next(sbot.backlinks, opts, ['value', 'timestamp']),
      pull.map(function (msg) {
        if (msg.value.private == true) return h('div.private')
        return render(msg)
      })
    )
  }

  pull(
    createStream({
      limit: 10,
      reverse: true, 
      index: 'DTA',
      live: false,
      query: [{$filter: {dest: id}}]
    }),
    stream.bottom(content)
  )

    pull(
    createStream({
      limit: 10,
      old: false,
      index: 'DTA',
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
          return render(h('div', msg))
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

    var editname = h('span', 
      avatar.name(src), 
      h('button.btn', 'New name', {
        onclick: function () {
          var nameput = h('input', {placeholder: name.textContent})
          var nameedit = 
            h('span', nameput, 
              h('button.btn', 'Preview', {
                onclick: function () {
                  if (nameput.value[0] != '@')
                    tobename = nameput.value
                  else
                    tobename = nameput.value.substring(1, 100)
                  var newname = h('span', h('a', {href: '#' + src}, '@' + tobename), h('button.btn', 'Publish', {
                    onclick: function () {
                      var donename = h('span', h('a', {href: '#' + src}, '@' + tobename)) 
                      sbot.publish({type: 'about', about: src, name: tobename})
                      localStorage[src + 'name'] = tobename
                      newname.parentNode.replaceChild(donename, newname)
                   }
                  }))
                  nameedit.parentNode.replaceChild(newname, nameedit) 
                }
              })
            )
          editname.parentNode.replaceChild(nameedit, editname)
        }
      })
    )

    var editimage = h('span',
      h('button.btn', 'New image', {
        onclick: function () {
          var upload = 
          h('span',
            hyperfile.asDataURL(function (data) {
              if(data) {
                //img.src = data
                var _data = dataurl.parse(data)
                pull(
                  pull.once(_data.data),
                  sbot.addblob(function (err, hash) {
                    if(err) return alert(err.stack)
                    selected = {
                      link: hash,
                      size: _data.data.length,
                      type: _data.mimetype
                    }
                  })
                )
              }
            }),
            h('button.btn', 'Preview image', {
              onclick: function() {
                if (selected) {
                  console.log(selected)
                  var oldImage = document.getElementById('profileImage')
                  var newImage = h('span.avatar--medium', h('img', {src: config.blobsUrl + selected.link}))
                  var publish = h('button.btn', 'Publish image', {
                    onclick: function () {
                      sbot.publish({
                        type: 'about',
                        about: src,
                        image: selected
                      }, function (err, published) {
                        console.log(published)
                      })
                    }
                  })
                  upload.parentNode.replaceChild(publish, upload)
                  oldImage.parentNode.replaceChild(newImage, oldImage)
                }
              /*if(selected) {
                api.message_confirm({
                  type: 'about',
                  about: id,
                  image: selected
                })
              } else { alert('select an image before hitting preview')}*/
              }
            })
          )
        editimage.parentNode.replaceChild(upload, editimage)
        }
      })
    )

    var avatars = h('div.avatars', 
      h('a', {href: '#' + src},
        h('span.avatar--medium#profileImage', avatar.image(src)),
        editname,
        h('br'),
        editimage
      )
    )
    
    pull(
      sbot.userStream({id: src, reverse: false, limit: 1}),
      pull.drain(function (msg) { 
        var howlong = h('span', h('br'), ' arrived ', human(new Date(msg.value.timestamp)))
        avatars.appendChild(howlong)
        console.log(msg)
      })
    )


    var buttons = h('div.buttons')
   
    profile.firstChild.appendChild(avatars)
    profile.firstChild.appendChild(buttons)
    buttons.appendChild(tools.mute(src))

    var writeMessage = h('button.btn', 'Public message ', avatar.name(src), {
      onclick: function () {
        opts = {}
        opts.type = 'post'
        opts.mentions = '[' + name.textContent + '](' + src + ')'
        var composer = h('div#composer', h('div.message', compose(opts)))
        profile.appendChild(composer)
      }
    })

    var writePrivate = h('button.btn', 'Private message ', avatar.name(src), {
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

    buttons.appendChild(h('button.btn', 'Generate follows', {
      onclick: function () {
        profile.firstChild.appendChild(tools.getFollowing(src))
        profile.firstChild.appendChild(tools.getFollowers(src))
      }
    }))    

    buttons.appendChild(h('button.btn', 'Generate blocks', {
      onclick: function () {
        profile.firstChild.appendChild(tools.getBlocks(src))
        profile.firstChild.appendChild(tools.getBlocked(src))
      }
    }))    


}

var privateMsg = function (src) {
  var content = h('div.content')
  var screen = document.getElementById('screen')
  screen.appendChild(hyperscroll(content))

  sbot.get(src, function (err, data) {
    if (err) {
      var message = h('div.message', 'Missing message!')
      content.appendChild(message)
    }
    if (data) {
      console.log(data)
      data.value = data
      data.key = src

      content.appendChild(render(data))
    }

  })
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
    if (err) {
      var message = h('div.message', 'Missing message!')
      content.appendChild(message)
    }
    if (data) {
      data.value = data
      data.key = src
      console.log(data)
      var rootMsg = render(data)

      if (content.firstChild) {
        content.insertBefore(rootMsg, content.firstChild)
      } else {
        content.appendChild(rootMsg)
      }
      if (data.value.content.type == 'git-repo') {
        pull(
          sbot.backlinks({query: [{$filter: {value: {content: {type: 'git-update'}}, dest: src}}]}),
          pull.drain(function (msg) {
            if (msg.value) {
              content.appendChild(render(msg))
            }
          })
        )
      }

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
          if (msg.value.timestamp > Date.now()) {
            return h('div.future')
          } else {
            return render(msg)
          }
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

function backchannel () {

  var screen = document.getElementById('screen')
  var content = h('div.content')

  screen.appendChild(hyperscroll(content))

  var chatbox = h('input', {placeholder: 'Backchannel'})

  var chat = h('div.content')

  var publish = h('button.btn', 'Publish', {
    onclick: function () {
      if (chatbox.value) {
        var content = {
          text: chatbox.value,
          type: 'scat_message'
        }
        sbot.publish(content, function (err, msg) {
          if (err) throw err
          chatbox.value = ''
          console.log('Published!', msg)
        })
      }
    } 
  })

  chat.appendChild(h('div.message', chatbox, publish))

  if (screen.firstChild.firstChild) {
    screen.firstChild.insertBefore(chat, screen.firstChild.firstChild)
  } else {
    screen.firstChild.appendChild(chat)
  }

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
      query: [{$filter: { value: { content: {type: 'scat_message'}, timestamp: { $gt: 0 }}}}]
    }),
    stream.bottom(content)
  )

  pull(
    createStream({
      limit: 10,
      old: false,
      live: true,
      query: [{$filter: { value: { content: {type: 'scat_message'}, timestamp: { $gt: 0 }}}}]
    }),
    stream.top(content)
  )
}

function search (src) {
  console.log('search' + src)
  
  var content = h('div.content')
  var screen = document.getElementById('screen')
  screen.appendChild(hyperscroll(content))
  
  pull(
    sbot.search.query({query: src, limit: 100}),
    pull.drain(function (search) {
      content.appendChild(render(search))
    })
  )

}

function hash () {
  return window.location.hash.substring(1)
}

module.exports = function () {
  var src = hash()
  console.log(src)

  if (src.substring(52, 59) == '?unbox=') {
    privateMsg(src) 
  } else if (ref.isFeed(src)) {
    userStream(src)
  } else if (ref.isMsg(src)) {
    msgThread(src)
  } else if (src == 'mentions') {
    mentionsStream()
  } else if (src == 'about') {
    about()
  } else if (src == 'backchannel') {
    backchannel()
  } else if (src == 'private') {
    privateStream()
  } else if (src == 'key') {
    keyPage()
  } else if (src[0] == '?' || (src[0] == '#')) {
    if (src[0] == '#')
      search(src.split('%20').join(' '))
    else
      search(src.substr(1).split('%20').join(' '))
  } else {
    everythingStream()
    checkInvite()
  }

}
