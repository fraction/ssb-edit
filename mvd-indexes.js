var Indexes = require('flumeview-query/indexes')
var pkg = require('./package.json')
exports.name = 'mvd-indexes'
exports.version = pkg.version
exports.manifest = {}

exports.init = function (sbot, config) {

  var view =
    sbot._flumeUse('query/mvd', Indexes(1, {
      indexes: [
        {key: 'chr', value: [['value', 'timestamp' ]]}
      ]
    }))

  var indexes = view.indexes()
  sbot.query.add(indexes[0])

  return {}
}
