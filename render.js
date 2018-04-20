var h = require('hyperscript')

var human = require('human-time')

var markdown = require('ssb-markdown')

module.exports = function (msg) {
  if (msg.value.content.type == 'post') {
    return h('div.message__content',
      h('span.timestamp', h('a', {href: msg.key}, human(new Date(msg.value.timestamp)))),
      msg.value.author,
      msg.value.content.text
    )
  } else { return }  
}
