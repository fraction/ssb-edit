var h = require('hyperscript')

var human = require('human-time')

var avatar = require('./avatar')

module.exports = function (msg) {
  if (msg.value.content.type == 'post') {
    return h('div.message__content',
      h('span.timestamp', h('a', {href: msg.key}, human(new Date(msg.value.timestamp)))),
      avatar.name(msg.value.author),
      msg.value.content.text
    )
  } else { return }  
}
