var pull = require('pull-stream')
var query = require('./scuttlebot').query
var h = require('hyperscript')
var visualize = require('visualize-buffer')

var config = require('./config')()

module.exports.name = function (id) {
  
  function getName (id) {
    pull(query({query: [{$filter: { value: { author: id, content: {type: 'about', about: id, name: {'$truthy': true}}}}}], reverse: true}),
      pull.collect(function (err, data){
        if(data[0]) {
          localStorage[id + 'name'] = '@' + data[0].value.content.name
          name.textContent = localStorage[id + 'name']
      }
    }))
  }
  
  var name = h('span', id.substring(0, 10))

  if (localStorage[id + 'name']) {
    name.textContent = localStorage[id + 'name']
    getName(id) 
  }
  else {
    getName(id)
  }

  return name
}

var ref = require('ssb-ref')

module.exports.image = function (id) {
  function getImage (id) {
    pull(query({query: [{$filter: { value: { author: id, content: {type: 'about', about: id, image: {'$truthy': true}}}}}], reverse: true}),
      pull.collect(function (err, data){
        if(data[0]) {
          if (ref.isBlob(data[0].value.content.image.link)) { 
            var data = config.blobsUrl + data[0].value.content.image.link
            localStorage[id + 'image'] = data
            img.src = data
          } else if (ref.isBlob(data[0].value.content.image)) {
            var data = config.blobsUrl + data[0].value.content.image
            localStorage[id + 'image'] = data
            img.src = data
          }
        }
      })
    )
  }

  var img = visualize(new Buffer(id.substring(1), 'base64'), 256)

  if (localStorage[id + 'image']) {
    img.src = localStorage[id + 'image']
    getImage(id)
  } else {
    getImage(id)
  }
  return img
}

