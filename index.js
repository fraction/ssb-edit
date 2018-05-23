var h = require('hyperscript')
var route = require('./views')
var avatar = require('./avatar')

var id = require('./keys').id

document.head.appendChild(h('style', require('./style.css.json')))

var screen = h('div#screen', {style: {position: 'absolute', top: '35px', bottom: '0px', left: '0px', right: '0px'}})

var nav = h('div.navbar',
  h('div.internal',
    h('li', h('a', {href: '#' + id}, h('span.avatar--small', avatar.image(id)))),
    h('li', h('a', {href: '#' + id}, avatar.name(id))),
    h('li', h('a', {href: '#'}, 'Public'))
  )
)

document.body.appendChild(nav)
document.body.appendChild(screen)
route()

window.onhashchange = function () {
  var oldscreen = document.getElementById('screen')
  var newscreen = h('div#screen', {style: {position: 'absolute', top: '35px', bottom: '0px', left: '0px', right: '0px'}})
  oldscreen.parentNode.replaceChild(newscreen, oldscreen)
  route()
}

