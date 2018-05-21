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
        var latest = h('div.message__body', 
          tools.markdown(update.value.content.text),
          h('span.timestamp', 'Edited: ', h('a', {href: '#' + update.key}, human(new Date(update.value.timestamp))))
        )
        var num = message.childNodes.length
        if (msg.value.author == id)
          var act = num - 3
        else 
          var act = num - 2
        message.replaceChild(latest, message.childNodes[act])
        edit.messageText = update.value.content.text
        edit.original = msg.value.content.original
      })
    )

    message.appendChild(h('button.btn', 'Reply', {
      onclick: function () {
        var compose = composer(reply)
        message.replaceChild(compose, message.lastElementChild)
      }
    }))
    if (msg.value.author == id)
      message.appendChild(h('button.btn', 'Edit', {
        onclick: function () {
          var compose = h('div.message', composer(edit))
          message.parentNode.replaceChild(compose, message)
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
