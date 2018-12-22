const pull = require('pull-stream')
const debug = require('debug')('ssb-edit')
const metaBackup = require('ssb-db/util').metaBackup

exports.init = (server) => {

  server.addMap(function (msg, cb) {
    if (server.currentSearch == null) {
      server.currentSearch = msg.key
    } else {
      return cb(null, msg)
    }

    debug('msg.key: %s', msg.key)

    const updates = []

    pull(
      server.query.read({
        query: [{
          $filter: {
            value: {
              content: {
                type: 'edit',
                original: msg.key
              }
            }
          }
        }],
        limit: 100
      }),
      pull.drain((update) => {
        updates.push(update)
      }, () => {
        debug('finished search')
        server.currentSearch = null

        if (updates.length === 0) {
          cb(null, msg)
        } else {

          msg.meta = metaBackup(msg.value, 'content')
          msg.value.content.text = updates[updates.length - 1].value.content.text
          cb(null, msg)
        }
      })
    )
  })
} 

exports.manifest = { publish: 'async' }
exports.name = 'edit'
exports.version = require('./package.json').version
