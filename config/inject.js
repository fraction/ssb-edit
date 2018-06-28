var path = require('path')
var home = require('os-homedir')
var nonPrivate = require('non-private-ip')
var merge = require('deep-extend')
var id = require('ssb-keys')
var RC = require('rc')
var SEC = 1e3
var MIN = 60*SEC

module.exports = function (name, override) {
  console.log('Using the ' + name + ' config')

  var network

  if (name === 'ssb') {
    network = {
      port: 8008,
      ws: {
        port: 8989
      },
      caps: {
        shs: '1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s=',
        sign: null
      }
    }
  }

  if (name === 'decent') {
    network = {
      port: 3333,
      ws: {
        port: 3939
      }, 
      caps: { 
        shs: 'EVRctE2Iv8GrO/BpQCF34e2FMPsDJot9x0j846LjVtc=',
        sign: null 
      }
    }
  }

  if (name === 'testnet') {
    network = {   
      port: 9999,
      ws: {
        port: 9191
      }, 
      caps: {
        shs: 'sR74I0+OW6LBYraQQ2YtFtqV5Ns77Tv5DyMfyWbrlpI=',
        sign: null  
      }
    }
  }
  
  var HOME = home() || 'browser' //most probably browser

  return RC(name, merge(network, {
    name: name,
     //standard stuff that probably doesn't need to change below
    host: nonPrivate.v4 || '',
    timeout: 0,
    allowPrivate: true,
    pub: true,
    local: true,
    friends: {
      dunbar: 150,
      hops: 3
    },
    gossip: {
      connections: 3
    },
    path: path.join(HOME, '.' + name),
    timers: {
      connection: 0,
      reconnect: 5*SEC,
      ping: 5*MIN,
      handshake: 5*SEC
    },
    master: [],
    party: true //disable quotas
  }, override || {}))
}
