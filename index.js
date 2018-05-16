var h = require('hyperscript')
var route = require('./views')

document.head.appendChild(h('style', require('./style.css.json')))

var content = h('div.content')

var screen = h('div#screen', {style: {position: 'absolute', top: '0px', bottom: '0px', left: '0px', right: '0px'}})

document.body.appendChild(screen)
route()

window.onhashchange = function () {
  var screen = document.getElementById('screen')

  var newscreen = h('div#screen', {style: {position: 'absolute', top: '0px', bottom: '0px', left: '0px', right: '0px'}})

  console.log(screen)
  screen.parentNode.replaceChild(newscreen, screen)
  route()
}

