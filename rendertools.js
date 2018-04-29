var h = require('hyperscript')
var human = require('human-time')
var avatar = require('./avatar')
var ref = require('ssb-ref')

module.exports.header = function (msg) {
  return h('div.header',
    h('span.avatar',
      h('a', {href: '#' + msg.value.author},
        h('span.avatar--small', avatar.image(msg.value.author)),
        avatar.name(msg.value.author)
      )
    ),
    h('span.timestamp', h('a', {href: '#' + msg.key}, human(new Date(msg.value.timestamp)))),
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
