var h = require('hyperscript')
var pull = require('pull-stream')
var human = require('human-time')

var sbot = require('./scuttlebot')
var tools = require('./tools')

var config = require('./config')()
var id = require('./keys').id

var mime = require('simple-mime')('application/octect-stream')
var split = require('split-buffer')

function file_input (onAdded) {
  return h('label.btn', 'Upload file',
    h('input', { type: 'file', hidden: true,
    onchange: function (ev) {
      var file = ev.target.files[0]
      if (!file) return
      var reader = new FileReader()
      reader.onload = function () {
        pull(
          pull.values(split(new Buffer(reader.result), 64*1024)),
          sbot.addblob(function (err, blob) {
            if(err) return console.error(err)
            onAdded({
              link: blob,
              name: file.name,
              size: reader.result.length || reader.result.byteLength,
              type: mime(file.name)
            })
          })
        )
      }
      reader.readAsArrayBuffer(file)
    }
  }))
}

function composeButtons (msg, opts) {
  var files = []
  var filesById = {}

  var buttons = h('div.controls')

  var previewBtn = h('button.btn', 'Preview', {
    onclick: function () {
      var draft = {}
      draft.value = {
        "author": id,
        "content": {
          "type": opts.type,
          "root": opts.root
        }
      }
    
      if (opts.original)
        msg.value.content.original = opts.original
      if (opts.updated)
        msg.value.content.updated = opts.updated
    
      draft.value.content.text = textarea.value
      console.log(draft)
    }
  })

  /*var cancelBtn = h('button.btn', 'Cancel' {
    onclick: function () {
      
    }
  })*/

  buttons.appendChild(previewBtn)

  buttons.appendChild(
    file_input(function (file) {
      files.push(file)
      filesById[file.link] = file
      var embed = file.type.indexOf('image/') === 0 ? '!' : ''
      textarea.value += embed + '['+file.name+']('+file.link+')'
    })
  )
  return buttons 
  //buttons.appendChild(cancelBtn)
}


function defaultButtons (msg, reply, edit) {

  var buttons = h('div.controls')

  var replyBtn = h('button.btn', 'Reply', {
    onclick: function () {
      var textarea = h('textarea.compose', {placeholder: 'Reply to this message'})
      var reply = h('div.reply',
        textarea,
        composeButtons(msg, reply) 
      )

      buttons.parentNode.replaceChild(reply, buttons)
    }
  })

  var editBtn = h('button.btn', 'Edit', {
    onclick: function () {
      var textarea = h('textarea.compose', edit.messageText)
      var editor = h('div.edit',
        textarea,
        composeButtons(msg, edit)
      )

      var prevMessage = buttons.parentNode.childNodes[2]
      buttons.parentNode.replaceChild(editor, prevMessage)
      buttons.parentNode.removeChild(buttons)
    }
  })
  
  buttons.appendChild(replyBtn)

  if (msg.value.author == id)
    buttons.appendChild(editBtn)

  return buttons
}


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
          var act = num - 2
        else 
          var act = num - 2
        message.replaceChild(latest, message.childNodes[act])
        edit.messageText = update.value.content.text
        edit.original = msg.value.content.original
      })
    )
    message.appendChild(defaultButtons(msg, reply, edit))
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
