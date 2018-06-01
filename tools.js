var h = require('hyperscript')
var human = require('human-time')
var avatar = require('./avatar')
var ref = require('ssb-ref')

var pull = require('pull-stream')

var sbot = require('./scuttlebot')

var config = require('./config')()

var id = require('./keys').id

function votes (msg) {
  var votes = h('div.votes') 

  pull(
    sbot.links({rel: 'vote', dest: msg.key }),
    pull.drain(function (link) {
      sbot.get(link.key, function (err, data) {
        if (err) throw err
        if (data.content.vote.value == 1) {
          votes.appendChild(h('a#vote:' + data.author.substring(0, 44), {href:'#' + data.author, title: avatar.name(data.author)}, h('img.emoji', {src: config.emojiUrl + 'star.png'})))
        }
        else if (data.content.vote.value == -1) {
          var lookFor = 'vote:' + data.author.substring(0, 44)
          var remove = document.getElementById(lookFor)
          remove.parentNode.removeChild(remove)
        }
      })
    })
  )

  return votes
}

module.exports.star = function (msg) {

  var votebutton = h('span#star:' + msg.key.substring(0, 44))


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
          console.log('Starred!', voted)
          votebutton.replaceChild(unstar, star)   
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
          console.log('Unstarred!', voted)
          votebutton.replaceChild(star, unstar)
        })
      }
    }
  )

  votebutton.appendChild(star)

  /*pull(
    sbot.links({rel: 'vote', dest: msg.key}),
    pull.drain(function (link) {
      sbot.get(link.key, function (err, data) {
        if (err) throw err
        if (data.author == id)
          console.log(newbutton)
          console.log(data)
          if (data.content.vote.value == 1) {
            console.log(unstar)
          }
          else if (data.content.vote.value == -1) {
            console.log(star)
          }
      })
    })
  )*/

  return votebutton
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
  return h('div.header',
    h('span.avatar',
      h('a', {href: '#' + msg.value.author},
        h('span.avatar--small', avatar.image(msg.value.author)),
        avatar.name(msg.value.author)
      )
    ),
    exports.timestamp(msg),
    votes(msg)
  )
}

module.exports.messageLink = function (msglink) {
  var link = h('span', h('a', {href: '#' + msglink}, msglink.substring(0, 8) + '...'))
  return link
}

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
