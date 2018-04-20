var h = require('hyperscript')

var views = require('./views')

document.head.appendChild(h('style', require('./style.css.json')))

var src = window.location.hash

window.onhashchange = function () {
  window.location.reload()
}

if (src == '#raw') {
  views.rawstream()  
} else {
  views.logstream()
}
