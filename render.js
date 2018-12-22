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
