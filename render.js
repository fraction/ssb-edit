var h = require('hyperscript')
var pull = require('pull-stream')
var human = require('human-time')

var sbot = require('./scuttlebot')
var composer = require('./compose')
var tools = require('./tools')

var config = require('./config')()
var id = require('./keys').id


module.exports = function (msg) {
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
      sbot.query({query: [{$filter: {value: {content: {type: 'edit', original: msg.key}}}}], limit: 100, live: true}),
      pull.drain(function (update) {
        if (update.sync) { 
          //console.log('Waiting for new edits.')
        } else {
          var newMessage = h('div', tools.markdown(update.value.content.text))
          var latest = h('div.message__body', 
            tools.timestamp(update, {edited: true}),
            newMessage
          )
          message.replaceChild(latest, message.childNodes[message.childNodes.length - 2])
          fallback.messageText = update.value.content.text
          opts.updated = update.key
          opts.original = msg.key
        } 
      })    
    )

    var buttons = h('div.buttons')
    buttons.appendChild(h('button.btn', 'Reply', {
      onclick: function () {
        opts.type = 'post'
        var r = message.childNodes.length - 1
        delete opts.updated
        delete opts.original 
        delete fallback.messageText
        fallback.buttons = message.childNodes[r]
        var compose = h('div.message#re:' + msg.key.substring(0, 44), composer(opts, fallback))
        message.removeChild(message.childNodes[r])
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

    buttons.appendChild(tools.star(msg))
    message.appendChild(buttons)
    return message

  } else if (msg.value.content.type == 'vote') {
    if (msg.value.content.vote.value == 1)
      var link = h('span', ' ', h('img.emoji', {src: config.emojiUrl + 'star.png'}), ' ', h('a', {href: '#' + msg.value.content.vote.link}, msg.value.content.vote.link.substring(0,16) + '...'))
    else if (msg.value.content.vote.value == -1)
      var link = h('span', ' ', h('img.emoji', {src: config.emojiUrl + 'stars.png'}), ' ', h('a', {href: '#' + msg.value.content.vote.link}, msg.value.content.vote.link.substring(0,16) + '...'))
    message.appendChild(tools.mini(msg, link))
    return message
  } else {
    //message.appendChild(tools.header(msg)) 
    //message.appendChild(h('pre', tools.rawJSON(msg.value.content)))
    //return message
    return h('div.invisibleMessage')
  }
}
