var h = require('hyperscript')
var markdown = require('ssb-markdown')
var config = require('./config')()

var sbot = require('./scuttlebot')
var composer = require('./compose')

var tools = require('./rendertools')

module.exports = function (msg) {

  var message = h('div.message')
  if (msg.value.content.type == 'post') {
    message.appendChild(tools.header(msg))
    if (msg.value.content.root) {
      message.appendChild(h('span', 're: ', tools.messageLink(msg.value.content.root)))
    }
    message.appendChild(h('div.message__body', 
        {innerHTML: markdown.block(msg.value.content.text, {toUrl: function (url, image) {
          if(url[0] == '%' || url[0] == '@') return '#' + url
          if(!image) return url
          if(url[0] !== '&') return url
          return config.blobsUrl + url
        }})}
      )
    )
    message.appendChild(h('button.btn', 'Reply', {
      onclick: function () {
        var compose = composer()
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
        embedded.appendChild(h('div.message__body',
          {innerHTML: markdown.block(msg.value.content.text.substring(0, 256) + '... ', {toUrl: function (url, image) {
            if(url[0] == '@') return '#' + url
            if(url[0] == '%') return '#' + url
            if(!image) return url
            if(url[0] !== '&') return url
            return config.blobsUrl + url
          }})}, tools.messageLink(msg.key)
        ))
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
