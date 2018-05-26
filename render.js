var h = require('hyperscript')
var pull = require('pull-stream')
var human = require('human-time')

var sbot = require('./scuttlebot')
var composer = require('./compose')
var tools = require('./tools')

var config = require('./config')()
var id = require('./keys').id

module.exports = function (msg) {
  var edit = {}
  var reply = {}

  var message = h('div.message')

  if (msg.value.content.type == 'post') {
    reply.type = 'post'
    reply.branch = msg.key

    if (msg.value.content.root) 
      reply.root = msg.value.content.root
    else  
      reply.root = msg.key 
 
    if (msg.value.author == id)
      edit.original = msg.key
      edit.type = 'update'
      edit.updated = msg.key
      edit.messageText = msg.value.content.text 

    message.appendChild(tools.header(msg))

    if (msg.value.content.root) {
      message.appendChild(h('span', 're: ', tools.messageLink(msg.value.content.root)))
    }

    message.appendChild(
      h('div.message__body', tools.markdown(msg.value.content.text))
    )

    pull(
      sbot.query({query: [{$filter: {value: {content: {type: 'update', updated: msg.key}}}}]}),
      pull.drain(function (update) {
        var newMessage = h('div', tools.markdown(update.value.content.text))
        var latest = h('div.message__body', 
          tools.timestamp(msg, {edited: true}),
          newMessage
        )
        var r = message.childNodes.length - 2
        message.replaceChild(latest, message.childNodes[r])
        edit.messageText = update.value.content.text
        edit.original = msg.value.content.original
      })
    )
    var buttons = h('div.buttons')
    buttons.appendChild(h('button.btn', 'Reply', {
      onclick: function () {
        var r = message.childNodes.length - 1
        buttons = message.childNodes[r]
        //fallback = message.lastElementChild
        //console.log(fallback)
        var compose = h('div.message#' + reply.branch.substring(0, 10), composer(reply, buttons))
        message.parentNode.appendChild(compose)
        //message.replaceChild(compose, message.lastElementChild)
      }
    }))
    if (msg.value.author == id)
      buttons.appendChild(h('button.btn', 'Edit', {
        onclick: function () {
          var r = message.childNodes.length - 1
          buttons = message.childNodes[r]
          message.removeChild(message.childNodes[r])
          var compose = h('div#' + edit.updated.substring(0, 10), composer(edit, buttons))
          message.replaceChild(compose, message.lastElementChild)
        }
      }))

    message.appendChild(buttons)
    return message

  } else if (msg.value.content.type == 'vote') {
    message.appendChild(tools.header(msg))
    message.appendChild(h('span', 'Starred:'))
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
