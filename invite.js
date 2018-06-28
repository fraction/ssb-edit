var ref = require('ssb-ref')
var h = require('hyperscript')
var client = require('ssb-client')
var sbot = require('./scuttlebot')
var config = require('./config')()

var keys = require('./keys')


function parseInvite (invite) {
  return ref.parseInvite(invite)
}

module.exports = function () {

  setTimeout(function () {
    var currentScreen = document.getElementById('screen')
    var invitebox =  h('input', {placeholder: 'Invite Code Here'})
    invitebox.value = config.invite
    var invite = h('div.content', h('div.message#inviter',
      'Hey, no one follows you. Your secure-scuttlebutt feed may not replicate unless a pub follows you. Either ', h('a', {href: '#key'}, 'import your key'), ' or use a pub invite:',
      h('br'),
      invitebox,
      h('button.btn', 'Accept', {onclick: function (e) {
        var data = parseInvite(invitebox.value)
        e.preventDefault()
        //sbot.gossip.connect(data.remote, function (err) {
  
        //})
  
        client(keys, {
          remote: data.invite,
          caps: config.caps,
          manifest: {invite: {use: 'async'}, getAddress: 'async'}
        }, function (err, remotebot) {
          if (err) throw err
          remotebot.invite.use({feed: keys.id}, function (_err, msg) {
            if (msg) {
              sbot.publish({
                type: 'contact',
                contact: data.key,
                following: true
              })
            }
          })
          setTimeout(function () {
            location.hash = '#' + keys.id
            location.hash = '#'
          }, 100)
        })
      }})
    ))
    if (currentScreen.firstChild.firstChild) {
      currentScreen.firstChild.insertBefore(invite, currentScreen.firstChild.firstChild)
    } else {
      currentScreen.firstChild.appendChild(invite)
    }
    sbot.friends.get({dest: keys.id}, function (err, follows) {
      for (var i in follows) {
        if (follows[i] === true) {
          var getInvite = document.getElementById('inviter')
  
          if (getInvite) {
            getInvite.parentNode.removeChild(getInvite)
          }
        }
      }
    })
  
  
  }, 1000)

}
