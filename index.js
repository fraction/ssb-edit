var h = require('hyperscript')
var route = require('./views')
var avatar = require('./avatar')

var compose = require('./compose')

var id = require('./keys').id

document.head.appendChild(h('style', require('./style.css.json')))

var screen = h('div#screen')

var nav = h('div.navbar',
  h('div.internal',
    h('li', h('a', {href: '#' + id}, h('span.avatar--small', avatar.image(id)))),
    h('li', h('a', {href: '#' + id}, avatar.name(id))),
    h('li', h('a', 'Compose', {
      onclick: function () {
        if (document.getElementById('composer')) { return }
        else {
          var currentScreen = document.getElementById('screen')
          var opts = {}
          opts.type = 'post'
          var composer = h('div.content#composer', h('div.message', compose(opts)))
          if (currentScreen.firstChild.firstChild) {
            currentScreen.firstChild.insertBefore(composer, currentScreen.firstChild.firstChild)
          } else {
            currentScreen.firstChild.appendChild(composer)
          }
        }
      }
    })),
    h('li', h('a', {href: '#'}, 'Stream')),
    h('li', h('a', {href: '#mentions' }, 'Mentions')),
    h('li', h('a', {href: '#private' }, 'Inbox')),
    h('li', h('a', {href: '#key' }, 'Key')),
    h('li.right', h('a', {href: '#about'}, '?'))
  )
)

document.body.appendChild(nav)
document.body.appendChild(screen)
route()

window.onhashchange = function () {
  var oldscreen = document.getElementById('screen')
  var newscreen = h('div#screen')
  oldscreen.parentNode.replaceChild(newscreen, oldscreen)
  route()
}

