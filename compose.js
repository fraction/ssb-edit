var h = require('hyperscript')
var pull = require('pull-stream')
var sbot = require('./scuttlebot')
var human = require('human-time')
var id = require('./keys').id

var tools = require('./tools')

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

module.exports = function (opts) {
  var files = []
  var filesById = {}

  var composer = h('div.composer')
  var container = h('div.container')

  if (opts.messageText)
    var textarea = h('textarea.compose', opts.messageText)
  else
    var textarea = h('textarea.compose', {placeholder: opts.placeholder || 'Write a message'})

  var initialButtons = h('span', 
    h('button.btn', 'Preview', {
      onclick: function () {
      
        var msg = {}
        msg.value = {
          "author": id,
          "content": {
            "type": opts.type
          }
        }

        if (opts.root)
          msg.value.content.root = opts.root
        if (opts.original)
          msg.value.content.original = opts.original
        if (opts.updated)
          msg.value.content.updated = opts.updated

        msg.value.content.text = textarea.value
        console.log(msg)

        if (opts.type == 'post') 
          var header = tools.header(msg)
        if (opts.type == 'update')
          var header = h('div.timestamp', 'Edited:', h('a', {href: msg.key}, human(new Date(msg.value.timestamp))))

        var preview = h('div',
          header,
          h('div.message__content', tools.markdown(msg.value.content.text)),
          h('button.btn', 'Publish', {
            onclick: function () {
              sbot.publish(msg.value.content, function (err, msg) {
                if(err) throw err
                console.log('Published!', msg)
                window.location.reload()
                if(cb) cb(err, msg)
              })
            }
          }),
          h('button.btn', 'Cancel', {
            onclick: function () {
              composer.replaceChild(container, composer.firstChild)
              container.appendChild(textarea)
              container.appendChild(initialButtons)
            }
          })
        )
        composer.replaceChild(preview, composer.firstChild)
      }
    }),
    file_input(function (file) {
      files.push(file)
      filesById[file.link] = file
      var embed = file.type.indexOf('image/') === 0 ? '!' : ''
      textarea.value += embed + '['+file.name+']('+file.link+')'
    }),
    h('button.btn', 'Cancel', {
      onclick: function () {
        var message = document.getElementById(opts.branch.substring(0,10))
        if (opts.updated)
          message.parentNode.removeChild(message)
        else
          message.parentNode.removeChild(message)
      }
    })
  )

  composer.appendChild(container)
  container.appendChild(textarea)
  container.appendChild(initialButtons)

  return composer
} 

