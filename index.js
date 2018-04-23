var h = require('hyperscript')

var views = require('./views')

var ref = require('ssb-ref')

document.head.appendChild(h('style', require('./style.css.json')))

var src = window.location.hash.substring(1)

window.onhashchange = function () {
 window.location.reload()
}

console.log(src)

if (src == 'raw') {
  views.rawstream()  
} else if (ref.isFeed(src)) { 
  views.userstream(src)
} else if (ref.isMsg(src)) { 
  views.get(src)
} else {
  views.logstream()
}
