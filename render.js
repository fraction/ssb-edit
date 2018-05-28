var h = require('hyperscript')
var pull = require('pull-stream')
var human = require('human-time')

var sbot = require('./scuttlebot')
var composer = require('./compose')
var tools = require('./tools')

var config = require('./config')()
var id = require('./keys').id


module.exports = function (msg) {
  console.log(msg)
  var message = h('div.message#' + msg.key.substring(0, 44))
  if (msg.value.content.type == 'post') {
    var opts = {
      type: 'post',
      branch: msg.key
    }
    var fallback = {}


    if (msg.value.content.root) 
      opts.root = msg.value.content.root
    else  
      opts.root = msg.key 

    message.appendChild(tools.header(msg))

    if (msg.value.content.root) 
      message.appendChild(h('span', 're: ', tools.messageLink(msg.value.content.root)))

    message.appendChild(h('div.message__body', tools.markdown(msg.value.content.text)))


    pull(
      sbot.query({query: [{$filter: {value: {content: {type: 'edit', original: msg.key}}}}]}),
      pull.drain(function (update) {
        var newMessage = h('div', tools.markdown(update.value.content.text))
        var latest = h('div.message__body', 
          tools.timestamp(update, {edited: true}),
          newMessage
        )
        message.replaceChild(latest, message.childNodes[message.childNodes.length - 2])
        fallback.messageText = update.value.content.text
        opts.updated = update.key
        opts.original = msg.key
      })
    )

    var buttons = h('div.buttons')
    buttons.appendChild(h('button.btn', 'Reply', {
      onclick: function () {
        var r = message.childNodes.length - 1
        delete opts.updated
        delete opts.original 
        fallback.buttons = message.childNodes[r]
        var compose = h('div.message#re:' + msg.key.substring(0, 44), composer(opts, fallback))
        message.parentNode.insertBefore(compose, message.nextSibling)
      }
    }))

    if (msg.value.author == id)
      buttons.appendChild(h('button.btn', 'Edit', {
        onclick: function () {
          opts.type = 'edit'
          if (!fallback.messageText) 
            fallback.messageText = msg.value.content.text
 
          if (!opts.updated)
            opts.updated = msg.key
            opts.original = msg.key

          var r = message.childNodes.length - 1
          fallback.buttons = message.childNodes[r]
          message.removeChild(message.childNodes[r])
          var compose = h('div#edit:' + msg.key.substring(0, 44), composer(opts, fallback))
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
    return h('div.invisibleMessage')
  }
}
