var h = require('hyperscript')
var pull = require('pull-stream')
var human = require('human-time')

var sbot = require('./scuttlebot')
var composer = require('./compose')
var tools = require('./tools')

var config = require('./config')()
var id = require('./keys').id
var avatar = require('./avatar')

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
  else if (msg.value.content.type == 'scat_message') {
    var src = hash()
    if (src != 'backchannel') {
      message.appendChild(h('button.btn.right', h('a', {href: '#backchannel'}, 'Chat')))
    }
    message.appendChild(tools.mini(msg, ' ' + msg.value.content.text))
    return message
  }
  else if (msg.value.content.type == 'contact') {
    var contact = h('a', {href: '#' + msg.value.content.contact}, avatar.name(msg.value.content.contact))
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

    pull(
      sbot.get(msg.value.content.repo, function (err, data) {
        if (err) throw err
        if (data.content.name) {
          actualname = h('p', 'pushed to ', h('a', {href: '#' + msg.value.content.repo}, '%' + data.content.name))
          reponame.parentNode.replaceChild(actualname, reponame)
        }
      })
    )
    message.appendChild(cloneurl)

    var commits = h('ul')

    msg.value.content.commits.map(function (commit) {
      commits.appendChild(h('li', h('code', commit.sha1), ' - ', commit.title))
    })

    message.appendChild(commits)

    return message 
 
  }
  else if (msg.value.content.type == 'git-repo') {
    message.appendChild(tools.header(msg))
    if (msg.value.content.name) {
      message.appendChild(h('p', h('a', {href: msg.link}, '%' + msg.value.content.name)))
    } else {
      message.appendChild(h('p', h('a', {href: msg.link}, msg.link)))
    }
    var cloneurl = h('pre', 'git clone ssb://' + msg.key)
    message.appendChild(cloneurl)
    //message.appendChild(h('pre', tools.rawJSON(msg.value.content)))
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
      sbot.query({query: [{$filter: {value: {content: {type: 'edit', original: msg.key}}}}], limit: 100, live: true}),
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
      sbot.query({query: [{$filter: {value: {content: {type: 'edit', original: msg.key}}}}], limit: 100, live: true}),
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
    message.appendChild(tools.header(msg))
    message.appendChild(h('pre', tools.rawJSON(msg.value.content)))

    //MINI FALLBACK
    //var fallback = h('span', ' ' + msg.value.content.type)
    //message.appendChild(tools.mini(msg, fallback))
    return message 
  }
}
