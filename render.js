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

module.exports = function (msg) {
  if (msg.value.content.type == 'post') {
    return h('div.message__content',
      h('span.avatar', 
        h('a', {href: '#' + msg.value.author},
          h('span.avatar--small', avatar.image(msg.value.author)), 
          avatar.name(msg.value.author)
        )
      ),
      h('span.timestamp', h('a', {href: '#' + msg.key}, human(new Date(msg.value.timestamp)))),
      h('div.message__body', 
        {innerHTML: markdown.block(msg.value.content.text, {toUrl: function (url, image) {
          if(!image) return url
          if(url[0] !== '&') return url
          return config.blobsurl + url
        }})}
      )
    )
  } else { 
    return h('div.message__content',
      h('span.avatar',
        h('a', {href: '#' + msg.value.author},
          h('span.avatar--small', avatar.image(msg.value.author)),
          avatar.name(msg.value.author)
        )
      ),
      h('span.timestamp', h('a', {href: '#' + msg.key}, human(new Date(msg.value.timestamp)))),
      h('pre', rawJSON(msg.value.content))  
    )
  }
}
