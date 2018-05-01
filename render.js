var h = require('hyperscript')
var config = require('./config')()

var pull = require('pull-stream')

var sbot = require('./scuttlebot')
var composer = require('./compose')

var tools = require('./tools')

module.exports = function (msg) {
  var opts = {}
  opts.root = null
  var message = h('div.message')


  if (msg.value.content.type == 'post') {


    opts.type = 'post'
    opts.branch = msg.key

    message.appendChild(tools.header(msg))

    if (msg.value.content.root) {
      message.appendChild(h('span', 're: ', tools.messageLink(msg.value.content.root)))
      opts.root = msg.value.content.root
    } else { opts.root = msg.key }


    message.appendChild(
      h('div.message__body', tools.markdown(msg.value.content.text))
    )
    
    message.appendChild(h('button.btn', 'Reply', {
      onclick: function () {
        var compose = composer(opts)
        message.replaceChild(compose, message.lastElementChild)
      }
    }))
    return message
  } else if (msg.value.content.type == 'vote') {
    message.appendChild(tools.header(msg))
    var embed = msg.value.content.vote.link

    var embedded = h('div.embedded')
    sbot.get(embed, function (err, msg) {
      if (err) {console.log('could not find message locally, try ooo?') }
      msg.value = msg
      msg.key = embed
      if (msg.value.content.text) {
        message.appendChild(embedded)
        embedded.appendChild(tools.header(msg))
        embedded.appendChild(
          h('div.message__body', 
            tools.markdown(msg.value.content.text.substring(0, 256) + '...'),
            h('span', '[', h('a', {href: '#' + msg.key}, 'Full Post'), ']')
          )
        )
      }
    })
    return message
  } else {
    //message.appendChild(tools.header(msg)) 
    //message.appendChild(h('pre', tools.rawJSON(msg.value.content)))
    //return message
    return
  }
}
