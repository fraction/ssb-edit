var h = require('hyperscript')
var human = require('human-time')
var avatar = require('./avatar')
var ref = require('ssb-ref')

var ssbKeys = require('ssb-keys')

var pull = require('pull-stream')

var sbot = require('./scuttlebot')

var config = require('./config')()

var id = require('./keys').id

module.exports.box = function (content) {
  return ssbKeys.box(content, content.recps.map(function (e) {
    return ref.isFeed(e) ? e : e.link
  }))
}

module.exports.publish = function (content, cb) {
  if(content.recps)
    content = exports.box(content)
  sbot.publish(content, function (err, msg) {
    if(err) throw err
    console.log('Published!', msg)
    if(cb) cb(err, msg)
  })
}

module.exports.done = function (src) {
  var content = {
    type: 'done',
    vote: {'link': src}
  }

  var done = h('button.btn.right', 'Done ', h('img.emoji', {src: config.emojiUrl + 'v.png'}), {
    onclick: function () {
      content.done = true
      content.mentions = [id]
      content.recps = [id]
      exports.publish(content, function (err, published) {
        if (err) throw err
      })
    }
  })

  return done
  
}

module.exports.mute = function (src) {
  if (!localStorage[src])
    var cache = {mute: false}
  else
    var cache = JSON.parse(localStorage[src])

  if (cache.mute == true) {
    var mute = h('button.btn', 'Unmute', {
      onclick: function () {
        cache.mute = false
        localStorage[src] = JSON.stringify(cache)
        location.reload()
      }
    })
    return mute
  } else {
    var mute = h('button.btn', 'Mute', {
      onclick: function () {
        cache.mute = true
        localStorage[src] = JSON.stringify(cache)
        location.reload()
      }
    })
    return mute
  }
}

module.exports.star = function (msg) {
  var votebutton = h('span.star:' + msg.key.substring(0,44))

  var vote = {
    type: 'vote',
    vote: { link: msg.key, expression: 'Star' }
  }

  var star = h('button.btn.right', 'Star ',
    h('img.emoji', {src: config.emojiUrl + 'star.png'}), {
      onclick: function () {
        vote.vote.value = 1
        sbot.publish(vote, function (err, voted) {
          if(err) throw err
        })
      }
    }
  )
  
  var unstar = h('button.btn.right ', 'Unstar ',
    h('img.emoji', {src: config.emojiUrl + 'stars.png'}), {
      onclick: function () {
        vote.vote.value = -1
        sbot.publish(vote, function (err, voted) {
          if(err) throw err
        })
      }
    }
  )

  votebutton.appendChild(star) 

  pull(
    sbot.links({rel: 'vote', dest: msg.key, live: true}),
    pull.drain(function (link) {
      if (link.key) {
        sbot.get(link.key, function (err, data) {
          if (err) throw err
          if (data.content.vote) {
            if (data.author == id) {
              if (data.content.vote.value == 1)
                votebutton.replaceChild(unstar, star)
              if (data.content.vote.value == -1)
                votebutton.replaceChild(star, unstar)
            }
          }
        })
      }
    })
  )

  return votebutton
}

function votes (msg) {
  var votes = h('div.votes') 
  if (msg.key) {
    pull(
      sbot.links({rel: 'vote', dest: msg.key, live: true }),
      pull.drain(function (link) {
        if (link.key) {
          sbot.get(link.key, function (err, data) {
            if (err) throw err
            if (data.content.vote) {
              if (data.content.vote.value == 1) {
                if (localStorage[data.author + 'name'])
                  name = localStorage[data.author + 'name']
                else
                  name = data.author
                votes.appendChild(h('a#vote:' + data.author.substring(0, 44), {href:'#' + data.author, title: name}, h('img.emoji', {src: config.emojiUrl + 'star.png'})))
              }
              else if (data.content.vote.value == -1) {
                var lookFor = 'vote:' + data.author.substring(0, 44)
                document.getElementById(lookFor, function (err, gotit) {
                  if (err) throw err
                  gotit.parentNode.removeChild(remove)
                })
              }
            }
          })
        }
      })
    )
  }
  return votes
}

module.exports.timestamp = function (msg, edited) {
  var timestamp
  if (edited)
    timestamp = h('span.timestamp', 'Edited: ', h('a', {href: '#' + msg.key}, human(new Date(msg.value.timestamp))))
  else 
    timestamp = h('span.timestamp', h('a', {href: '#' + msg.key}, human(new Date(msg.value.timestamp))))
  return timestamp
}


module.exports.mini = function (msg, content) {
  return h('div.mini',
    h('span.avatar',
      h('a', {href: '#' + msg.value.author},
        h('span.avatar--small', avatar.image(msg.value.author)),
        avatar.name(msg.value.author)
      )
    ),
    exports.timestamp(msg),
    content
  )
}


module.exports.header = function (msg) {
  var header = h('div.header')

  header.appendChild(h('span.avatar',
      h('a', {href: '#' + msg.value.author},
        h('span.avatar--small', avatar.image(msg.value.author)),
        avatar.name(msg.value.author)
      )
    )
  )
    
  header.appendChild(exports.timestamp(msg))
  header.appendChild(votes(msg))

  if (msg.value.private)
    header.appendChild(h('span.right', ' ', h('img.emoji', {src: config.emojiUrl + 'lock.png'})))

  return header
}

var ref = require('ssb-ref')

module.exports.messageName = function (id, cb) {
  // gets the first few characters of a message, for message-link
  function title (s) {
    var m = /^\n*([^\n]{0,40})/.exec(s)
    return m && (m[1].length == 40 ? m[1]+'...' : m[1])
  }

  sbot.get(id, function (err, value) {
    if(err && err.name == 'NotFoundError')
      return cb(null, id.substring(0, 10)+'...(missing)')
    if(value.content.type === 'post' && 'string' === typeof value.content.text)
      return cb(null, title(value.content.text))
    else if('string' === typeof value.content.text)
      return cb(null, value.content.type + ':'+title(value.content.text))
    else
      return cb(null, id.substring(0, 10)+'...')
  })
}

var messageName = exports.messageName
var ref = require('ssb-ref')

module.exports.messageLink = function (id) {
  if (ref.isMsg(id)) {
    var link = h('a', {href: '#'+id}, id.substring(0, 10)+'...')
    messageName(id, function (err, name) {
      if(err) console.error(err)
      else link.textContent = name
    })
  } else {
    var link = id
  }
  return link
}


/*module.exports.messageLink = function (msglink) {
  var link = h('span', h('a', {href: '#' + msglink}, msglink.substring(0, 44) + '...'))

  if (ref.isMsg(msglink)) {
    pull(
      sbot.get(msglink, function (err, data) {
        console.log(data)
        if(err && err.name == 'NotFoundError') {
          var newlink = h('span', h('a', {href: '#' + msglink},  msglink.substring(0, 35) + ' (Missing)...'))
        }
        if(data.content.type === 'post' && 'string' === typeof data.content.text) {
          var newlink = h('span', h('a', {href: '#' + msglink}, data.content.text.substring(0, 44) + '...'))
        } 
        else {
          var newlink = h('span', h('a', {href: '#' + msglink}, msglink.substring(0, 44) + '...'))
        }
        if (link) {
          link.parentNode.replaceChild(newlink, link)
        }
      })
    )
  }

  return link
}*/

module.exports.rawJSON = function (obj) {
  return JSON.stringify(obj, null, 2)
    .split(/([%@&][a-zA-Z0-9\/\+]{43}=*\.[\w]+)/)
    .map(function (e) {
      if(ref.isMsg(e) || ref.isFeed(e) || ref.isBlob(e)) {
        return h('a', {href: '#' + e}, e)
      }
      return e
    })
}

var markdown = require('ssb-markdown')
var config = require('./config')()

module.exports.markdown = function (msg, md) {
  return {innerHTML: markdown.block(msg, {toUrl: function (url, image) {
    if(url[0] == '%' || url[0] == '@') return '#' + url
    if(!image) return url
    if(url[0] !== '&') return url
    return config.blobsUrl + url
  }})}
}
