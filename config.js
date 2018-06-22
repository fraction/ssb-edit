var http = require('http')

module.exports = function () {
  var host = window.location.origin

  if (localStorage[host])
    var config = JSON.parse(localStorage[host])
  else
    http.get(host + '/get-config', function (res) {
      res.on('data', function (data, remote) {
        var config = data
        localStorage[host] = config
        location.reload()
      })
    })

  config.blobsUrl = host + '/blobs/get/'
  config.emojiUrl = host + '/img/emoji/'

  if (config.ws.remote)
    config.remote = config.ws.remote
  else
    config.remote = config.address

  return config
}
