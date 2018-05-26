var h = require('hyperscript')
var human = require('human-time')
var avatar = require('./avatar')
var ref = require('ssb-ref')

var pull = require('pull-stream')

var sbot = require('./scuttlebot')

var config = require('./config')()

function votes (msg) {
  var votes = h('div.votes')
  if (msg.key) {
    pull(
      sbot.links({dest: msg.key, rel: 'vote'}),
      pull.drain(function (data) {
        if (data) {
          votes.appendChild(h('a', {href:'#' + data.key}, h('img.emoji', {src: config.emojiUrl + 'star.png'})))
        } else {console.log(data)}
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
