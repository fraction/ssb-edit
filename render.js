var h = require('hyperscript')
var pull = require('pull-stream')
var human = require('human-time')

var sbot = require('./scuttlebot')
var composer = require('./compose')
var tools = require('./tools')

var config = require('./config')()
var id = require('./keys').id
var avatar = require('./avatar')
var ssbAvatar = require('ssb-avatar')

var diff = require('diff')

function hash () {
  return window.location.hash.substring(1)
}

module.exports = function (msg) {
  var message = h('div.message#' + msg.key.substring(0, 44))

  if (!localStorage[msg.value.author])
    var cache = {mute: false}
  else
    var cache = JSON.parse(localStorage[msg.value.author])

  if (cache.mute == true) {
    var muted = h('span', ' muted')
    message.appendChild(tools.mini(msg, muted))
    return message
  } 
  else if (msg.value.content.type == 'edit') {
    message.appendChild(tools.header(msg))
    var current = msg.value.content.text
    sbot.get(msg.value.content.updated, function (err, updated) {
      if (updated) {
        fragment = document.createDocumentFragment()
        var previous = updated.content.text
        var ready = diff.diffWords(previous, current)
        console.log(ready)
        ready.forEach(function (part) {
          if (part.added === true) {
            color = 'cyan'
          } else if (part.removed === true) {
            color = 'gray'
          } else {color = 'white'}
          var span = h('span')
          span.style.color = color
          if (part.removed === true) {
            span.appendChild(h('del', document.createTextNode(part.value)))
          } else {
            span.appendChild(document.createTextNode(part.value))
          }
          fragment.appendChild(span)
        })
        message.appendChild(h('code', fragment))
      }
    })
    return message
  }


  else if (msg.value.content.type == 'scat_message') {
    var src = hash()
    if (src != 'backchannel') {
      message.appendChild(h('button.btn.right', h('a', {href: '#backchannel'}, 'Chat')))
    }
    message.appendChild(tools.mini(msg, ' ' + msg.value.content.text))
    return message
  }
  else if (msg.value.content.type == 'contact') {
    if (msg.value.content.contact) {
      var contact = h('a', {href: '#' + msg.value.content.contact}, avatar.name(msg.value.content.contact))
    } else { var contact = h('p', 'no contact named')}

    if (msg.value.content.following == true) {
      var following = h('span', ' follows ', contact)
      message.appendChild(tools.mini(msg, following))
    } 
    if (msg.value.content.following == false) {
      var unfollowing = h('span', ' unfollows ', contact)
      message.appendChild(tools.mini(msg, unfollowing))
    }
    if (msg.value.content.blocking == true) {
      var blocking = h('span', ' blocks ', contact)
      message.appendChild(tools.mini(msg, blocking))
    }
    if (msg.value.content.blocking == false) {
      var unblocking = h('span', ' unblocks ', contact)
      message.appendChild(tools.mini(msg, unblocking))
    }
    return message 
    
  }
  
  else if (msg.value.content.type == 'git-update') {

    message.appendChild(tools.header(msg))

    var reponame = h('p', 'pushed to ', h('a', {href: '#' + msg.value.content.repo}, msg.value.content.repo))

    var cloneurl = h('pre', 'git clone ssb://' + msg.value.content.repo)

    message.appendChild(reponame)


    ssbAvatar(sbot, id, msg.value.content.repo, function (err, data) {
      if (data) {
        var actualname = h('p', 'pushed to ', h('a', {href: '#' + msg.value.content.repo}, '%' + data.name))
        reponame.parentNode.replaceChild(actualname, reponame)
      }
    })     

    message.appendChild(cloneurl)

    var commits = h('ul')
    //if (msg.value.content.commits[0]) {
    if (msg.value.content.commits) {
      msg.value.content.commits.map(function (commit) {
        commits.appendChild(h('li', h('code', commit.sha1), ' - ', commit.title))
      })

    }

    message.appendChild(commits)

    return message 
 
  }
  else if (msg.value.content.type == 'git-repo') {
    message.appendChild(tools.header(msg))

    var reponame = h('p', 'git-ssb repo ', h('a', {href: '#' + msg.key}, msg.key))
   
    message.appendChild(reponame)

    ssbAvatar(sbot, id, msg.key, function (err, data) {
      if (data)
       var actualname = h('p', 'git-ssb repo ', h('a', {href: '#' + msg.key}, '%' + data.name))
       reponame.parentNode.replaceChild(actualname, reponame)
    })

    var cloneurl = h('pre', 'git clone ssb://' + msg.key)
    message.appendChild(cloneurl)
    return message  
  }

  else if (msg.value.content.type == 'wiki') {
    var fallback = {}

    var opts = {
      type: 'wiki',
      branch: msg.key
    }

    if (msg.value.content.root)
      opts.root = msg.value.content.root
    else
      opts.root = msg.key

    message.appendChild(tools.header(msg))

    message.appendChild(h('div.message__body', tools.markdown(msg.value.content.text)))

    pull(
      sbot.query({query: [{$filter: {value: {content: {type: 'edit', original: msg.key}}}}], limit: 100}),
      pull.drain(function (update) {
        if (update.sync) {
        } else {
          var newMessage = h('div', tools.markdown(update.value.content.text))
          var latest = h('div.message__body',
            tools.timestamp(update, {edited: true}),
            newMessage
          )
          message.replaceChild(latest, message.childNodes[message.childNodes.length - 2])
          fallback.messageText = update.value.content.text
          opts.updated = update.key
          opts.original = msg.key
        }
      })
    )

    var buttons = h('div.buttons')

    buttons.appendChild(h('button.btn', 'Edit wiki', {
      onclick: function () {
        opts.type = 'edit'
        if (!fallback.messageText)
          fallback.messageText = msg.value.content.text

        if (!opts.updated)
          opts.updated = msg.key
          opts.original = msg.key

        var r = message.childNodes.length - 1
        fallback.buttons = message.childNodes[r]
        message.removeChild(message.childNodes[r])
        var compose = h('div#edit:' + msg.key.substring(0, 44), composer(opts, fallback))
        message.replaceChild(compose, message.lastElementChild)
      }
    }))

    buttons.appendChild(tools.star(msg))
    message.appendChild(buttons)
    return message

  } else if (msg.value.content.type == 'post') {
    var opts = {
      type: 'post',
      branch: msg.key
    }
    var fallback = {}


    if (msg.value.content.root) 
      opts.root = msg.value.content.root
    else  
      opts.root = msg.key 

    message.appendChild(tools.header(msg))

    if (msg.value.content.root) 
      message.appendChild(h('span', 're: ', tools.messageLink(msg.value.content.root)))

    message.appendChild(h('div.message__body', tools.markdown(msg.value.content.text)))

    pull(
      sbot.query({query: [{$filter: {value: {content: {type: 'edit', original: msg.key}}}}], limit: 100}),
      pull.drain(function (update) {
        if (update.sync) { 
        } else {
          var newMessage = h('div', tools.markdown(update.value.content.text))
          var latest = h('div.message__body', 
            tools.timestamp(update, {edited: true}),
            newMessage
          )
          message.replaceChild(latest, message.childNodes[message.childNodes.length - 2])
          fallback.messageText = update.value.content.text
          opts.updated = update.key
          opts.original = msg.key
        } 
      })    
    )

    var name = avatar.name(msg.value.author)

    var buttons = h('div.buttons')

    buttons.appendChild(h('button.btn', 'Reply', {
      onclick: function () {
        opts.type = 'post'
        opts.mentions = '[' + name.textContent + '](' + msg.value.author + ')'
        if (msg.value.content.recps) {
          opts.recps = msg.value.content.recps
        }
        var r = message.childNodes.length - 1
        delete opts.updated
        delete opts.original 
        delete fallback.messageText
        fallback.buttons = message.childNodes[r]
        var compose = h('div.message#re:' + msg.key.substring(0, 44), composer(opts, fallback))
        message.removeChild(message.childNodes[r])
        message.parentNode.insertBefore(compose, message.nextSibling)
      }
    }))

    buttons.appendChild(h('button.btn', 'Boost', {
      onclick: function () {
        opts.type = 'post'
        opts.mentions = '[' + name.textContent + '](' + msg.value.author + ')'
        if (msg.value.content.recps) {
          opts.recps = msg.value.content.recps
        }
        var r = message.childNodes.length - 1
        delete opts.updated
        delete opts.original
        delete fallback.messageText
        opts.boostContent = msg.value.content.text
        opts.boostKey = msg.key
        opts.boostAuthor = msg.value.author
        fallback.buttons = message.childNodes[r]
        var compose = h('div.message#re:' + msg.key.substring(0, 44), composer(opts, fallback))
        message.removeChild(message.childNodes[r])
        message.parentNode.insertBefore(compose, message.nextSibling)
      }
    }))


    if (msg.value.author == id)
      buttons.appendChild(h('button.btn', 'Edit', {
        onclick: function () {
          opts.type = 'edit'
          if (!fallback.messageText) 
            fallback.messageText = msg.value.content.text
 
          if (!opts.updated)
            opts.updated = msg.key
            opts.original = msg.key

          var r = message.childNodes.length - 1
          fallback.buttons = message.childNodes[r]
          message.removeChild(message.childNodes[r])
          var compose = h('div#edit:' + msg.key.substring(0, 44), composer(opts, fallback))
          message.replaceChild(compose, message.lastElementChild)
        }
      }))

    buttons.appendChild(tools.star(msg))
    message.appendChild(buttons)
    return message

  } else if (msg.value.content.type == 'vote') {
    if (msg.value.content.vote.value == 1)
      var link = h('span', ' ', h('img.emoji', {src: config.emojiUrl + 'star.png'}), ' ', h('a', {href: '#' + msg.value.content.vote.link}, tools.messageLink(msg.value.content.vote.link)))
    else if (msg.value.content.vote.value == -1)
      var link = h('span', ' ', h('img.emoji', {src: config.emojiUrl + 'stars.png'}), ' ', h('a', {href: '#' + msg.value.content.vote.link}, tools.messageLink(msg.value.content.vote.link)))
    message.appendChild(tools.mini(msg, link))
    return message
  } else if (typeof msg.value.content === 'string') {
    var privateMsg = h('span', ' sent a private message.')
    message.appendChild(tools.mini(msg, privateMsg))
    return message
  } else {

    //FULL FALLBACK
    //message.appendChild(tools.header(msg))
    //message.appendChild(h('pre', tools.rawJSON(msg.value.content)))

    //MINI FALLBACK
    var fallback = h('span', ' ' + msg.value.content.type)
    message.appendChild(tools.mini(msg, fallback))
    return message 
  }
}
