var pull = require('pull-stream')
var query = require('./scuttlebot').query
var h = require('hyperscript')
var visualize = require('visualize-buffer')

var sbot = require('./scuttlebot')

var config = require('./config')()

module.exports.name = function (id) {
  
  function getName (id) {
    sbot.names.getSignifier(id, function (err, name) {
      if (name) {
        localStorage[id + 'name'] = '@' + name
        avatarname.textContent = '@' + name
      }
    })
  }
  
  var avatarname = h('span', id.substring(0, 10))

  if (localStorage[id + 'name']) {
    name.textContent = localStorage[id + 'name']
    getName(id) 
  } else {
    getName(id)
  }
  return avatarname
}

var ref = require('ssb-ref')

module.exports.image = function (id) {
  var img = visualize(new Buffer(id.substring(1), 'base64'), 256)

  function getImage (id) {
    sbot.names.getImageFor(id, function (err, image) {
      if (image) {
        localStorage[id + 'image'] = image
        img.src = config.blobsUrl + image
      }
    })
  } 

  if (localStorage[id + 'image']) {
    img.src = config.blobsUrl + localStorage[id + 'image']
    getImage(id)
  } else {
    getImage(id)
  }

  return img
}

