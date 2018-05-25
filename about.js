var h = require('hyperscript')

module.exports = function () {
  var content = h('div.message',
    h('p', h('strong', 'Decent'), ' is a decent(ralized) social network for business and development, built on ', h('a', {href: 'http://scuttlebot.io/'}, 'secure-scuttlebutt' ), '. Decent is maintained by ', h('a', {href: 'http://evbogue.com/'}, 'Everett Bogue'), '.'),
    h('p', h('strong', 'git repositories:')),
    h('ul',
      h('li', h('a', {href: 'http://github.com/evbogue/decent'}, 'Decent'), ' [Github]'),
      h('li', h('a', {href: 'http://github.com/evbogue/mvd'}, 'mvd'), ' [Github]')
    ),
    h('p', h('strong', 'secure-scuttlebutt'), ' (ssb) is a protocol for creating off-grid social networks using a gossip network to sync signed secure data from your friends (and their friends) to your local machine. ssb was invented by ', h('a', {href: 'http://dominictarr.com/'}, 'Dominic Tarr'), ' and is maintained by the ', h('a', {href: 'http://github.com/ssbc/'}, 'secure-scuttlebutt consortium (ssbc)'), '.'),
    h('p', h('strong', 'Press for ssb:')),
    h('ul',
      h('li', h('a', {href: 'https://staltz.com/an-off-grid-social-network.html'}, 'An Off-Grid Social Network'), ' [Andre Staltz]'),
      h('li', h('a', {href: 'https://www.theatlantic.com/technology/archive/2017/05/meet-the-counterantidisintermediationists/527553/'}, '...Exploding the Internet into Pieces'), ' [The Atlantic]'),
      h('li', 'Ev presents Decent at Chicago Node.js: ', 
        h('a', {href: 'http://evbogue.com/decent1.webm'}, 'Part 1'), ' ',
        h('a', {href: 'http://evbogue.com/decent2.webm'}, 'Part 2'), ' ',
        h('a', {href: 'http://evbogue.com/decent3.webm'}, 'Part 3'), ' ',
        h('a', {href: 'http://evbogue.com/decent4.webm'}, 'Part 4'), ' '
      )
    ),
    h('p', h('strong', 'Use Decent'), ' on your local machine by cloning the repository and building the software. Or, use a public Decent Pub to try Decent over websockets.'), 
    h('p', h('strong', 'Save your ', h('a', {href:'#key'} , 'key')), ' somewhere safe(!) to write to your append-only log. Decent will share your log with your friends (and their friends) using the gossip network. While you can edit messages by appending new messages to your log, any message you post will always exist on your secure log. Only use your key on one Decent instance at a time to avoid forking your log.'),
    h('p', 'Decent Pubs:'),
    h('ul',
      h('li', h('a', {href: 'http://decent.evbogue.com/'}, 'decent.evbogue.com')),
      h('li', h('a', {href: 'http://decent.gwenbell.com'}, 'decent.gwenbell.com')),
      h('li', 'Add your Decent ', h('a', {href: 'http://github.com/evbogue/mvd/'}, 'here'))
    ),
    h('p', 'The best way to use Decent is on your local machine, because you can read and write to your Decent without an Internet connection. Your messages will sync when you come online! Contact a Decent pub owner to request an invite to connect from your local machine.'),
    h('p', 'glhf and remember the first rule of Decent: be decent. -Ev')
  )

  return content
}
