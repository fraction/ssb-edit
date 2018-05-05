var h = require('hyperscript')
var config = require('./config')()

var pull = require('pull-stream')

var human = require('human-time')

var sbot = require('./scuttlebot')
var composer = require('./compose')

var tools = require('./tools')

var id = require('./keys').id

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
    }

    message.appendChild(
      h('div.message__body', tools.markdown(msg.value.content.text))
    )

    if (msg.value.author == id) {
      opts.type = 'update'
      opts.updated = msg.key
      opts.messageText = msg.value.content.text
      pull(
        sbot.query({query: [{$filter: {value: {content: {type: 'update', updated: msg.key}}}}]}),
        pull.drain(function (update) {
          var latest = h('div.message__body', 
            tools.markdown(update.value.content.text),
            h('span.timestamp', 'Edited: ', h('a', {href: '#' + update.key}, human(new Date(update.value.timestamp))))
          )
          var num = message.childNodes.length
          var act = num - 2
          console.log(act)
          message.replaceChild(latest, message.childNodes[act])
          opts.messageText = update.value.content.text
        })
    
      )


      if (msg.value.content.original)
        opts.original = msg.value.content.original
      else 
        opts.original = msg.key
      message.appendChild(h('button.btn', 'Edit', {
        onclick: function () {
          var compose = h('div.message', composer(opts))
          message.parentNode.replaceChild(compose, message)
        }
      }))
    } else {
      opts.type = 'post'
      opts.branch = msg.key

      if (msg.value.content.root) {
        message.appendChild(h('span', 're: ', tools.messageLink(msg.value.content.root)))
        opts.root = msg.value.content.root
      } else { opts.root = msg.key }
  
  
      pull(
        sbot.query({query: [{$filter: {value: {content: {type: 'update', updated: msg.key}}}}]}),
        pull.drain(function (data) {
          console.log(data)
          var latest = h('div.message__body', tools.markdown(data.value.content.text), h('span.timestamp', 'Edited: ' + human(new Date(data.value.timestamp))))
          var num = message.childNodes.length
          var act = num - 2

          message.replaceChild(latest, message.childNodes[act])
        })

      )

 
      message.appendChild(h('button.btn', 'Reply', {
        onclick: function () {
          var compose = composer(opts)
          message.replaceChild(compose, message.lastElementChild)
        }
      }))
    } 
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
