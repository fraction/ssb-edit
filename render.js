var h = require('hyperscript')
var human = require('human-time')
var ref = require('ssb-ref')
var avatar = require('./avatar')

var markdown = require('ssb-markdown')
var config = require('./config')()

function rawJSON (obj) {
  return JSON.stringify(obj, null, 2)
      .split(/([%@&][a-zA-Z0-9\/\+]{43}=*\.[\w]+)/)
      .map(function (e) {
        if(ref.isMsg(e) || ref.isFeed(e) || ref.isBlob(e)) {
          return h('a', {href: '#' + e}, e)
        }
        return e
      })
}

function header (msg) {
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

module.exports = function (msg) {
  var message = h('div.message')
  message.appendChild(header(msg))

  if (msg.value.content.type == 'post') {
    message.appendChild(h('div.message__body', 
        {innerHTML: markdown.block(msg.value.content.text, {toUrl: function (url, image) {
          if(url[0] == '%' || url[0] == '@') return '#' + url
          if(!image) return url
          if(url[0] !== '&') return url
          return config.blobsUrl + url
        }})}
      )
    )
    return message
  } else if (msg.value.content.type == 'vote') {
    var embed = msg.value.content.vote.link

    var embedded = h('div.embedded')
    sbot.get(embed, function (err, msg) {
      if (err) {console.log('could not find message locally, try ooo?') }
      msg.value = msg
      msg.key = embed
      if (msg.value.content.text) {
        message.appendChild(h('img.emoji', {src: config.emojiUrl + 'star.png'}))
        message.appendChild(embedded)
        embedded.appendChild(header(msg))
        embedded.appendChild(h('div.message__body',
          {innerHTML: markdown.block(msg.value.content.text, {toUrl: function (url, image) {
            if(url[0] == '@') return '#' + url
            if(url[0] == '%') return '#' + url
            if(!image) return url
            if(url[0] !== '&') return url
            return config.blobsUrl + url
          }})}
        ))
      }
    })
    return message
  } else { 
    message.appendChild(h('pre', rawJSON(msg.value.content)))
    return message
  }
}
