
var config = require('./config')()
var ssbKeys      = require('ssb-keys')
var path         = require('path')

module.exports = ssbKeys.loadOrCreateSync(path.join(config.caps.shs + '/secret'))
