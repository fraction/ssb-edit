var http = require('http')

module.exports = function () {
  var host = window.location.origin

  http.get(host + '/get-config', function (res) {
    res.on('data', function (data, remote) {
      config = data
      localStorage[host] = config
    })
  })

  var config = JSON.parse(localStorage[host])

  config.blobsUrl = host + '/blobs/get/'
  config.emojiUrl = host + '/img/emoji/'

  if (config.ws.remote)
    config.remote = config.ws.remote
  else
    config.remote = config.address

  return config
}
