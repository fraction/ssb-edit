var h = require('hyperscript')

var human = require('human-time')

var avatar = require('./avatar')

var markdown = require('ssb-markdown')
var config = require('./config')()

var rawJSON = require('patchapp-raw/json')

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
      h('pre.raw__json', {id: msg.key}, rawJSON(msg))  
    )
  }
}
