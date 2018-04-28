var h = require('hyperscript')
var pull = require('pull-stream')
var sbot = require('./scuttlebot')

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
  
  var textarea = h('textarea.compose', {placeholder: 'Reply to this post'})
  
  var composer = h('div',
    textarea,
    h('button.btn', 'Preview'),
    file_input(function (file) {
      files.push(file)
      filesById[file.link] = file
      var embed = file.type.indexOf('image/') === 0 ? '!' : ''
      textarea.value += embed + '['+file.name+']('+file.link+')'
    })
  )
  return composer
} 

