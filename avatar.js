var pull = require('pull-stream')
var query = require('./scuttlebot').query
var h = require('hyperscript')
var visualize = require('visualize-buffer')

var avatar = require('ssb-avatar')

var sbot = require('./scuttlebot')

var config = require('./config')()

var id = require('./keys').id

module.exports.name = function (key) {
  
  var avatarname = h('span', key.substring(0, 10))

  avatar(sbot, id, key, function (err, data) {
    if (err) throw err
    if (data.name) {
      if (data.name[0] != '@') {
        var name = '@' + data.name
      } else {
        var name = data.name
      }
      localStorage[key + 'name'] = name
      avatarname.textContent = name
    }
  }) 

  return avatarname
}

module.exports.image = function (key) {
  var img = visualize(new Buffer(key.substring(1), 'base64'), 256)

  avatar(sbot, id, key, function (err, data) {
    if (err) throw err
    if (data.image) {
      localStorage[key + 'image'] = data.image
      img.src = config.blobsUrl + data.image 
    }
  })

  return img
}

module.exports.cachedName = function (key) {
  var avatarname = h('span', key.substring(0, 10))

  if (localStorage[key + 'name']) {
    avatarname.textContent = localStorage[key + 'name']
  } else {
    avatar(sbot, id, key, function (err, data) {
      if (data.name) {
        if (data.name[0] != '@') {
          var name = '@' + data.name
        } else {
          var name = data.name
        }
        localStorage[key + 'name'] = name
        avatarname.textContent = name
      }
    })
  } 

  return avatarname
}

module.exports.cachedImage = function (key) {
  var img = visualize(new Buffer(key.substring(1), 'base64'), 256)

  if (localStorage[key + 'image']) {
    img.src = config.blobsUrl + localStorage[key + 'image']
  } else {
    avatar(sbot, id, key, function (err, data) {
      if (data.image) {
        localStorage[key + 'image'] = data.image
        img.src = config.blobsUrl + data.image
      }
    })
  }

  return img
}
