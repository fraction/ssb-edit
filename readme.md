# mvd

This is a minimum viable full-stack Decent server and client. 

Or you can call it model/view/decent

`scuttlebot.js` is the model
`views.js` is the views
`index.js` is the controller
and
`render.js` renders posts

### getting started
```
npm install
npm run build
npm start
```

It should launch a browser window, and comes pre-configured to use the Decent network by default. If you already have an `.decent` folder, mvd should 'just work'.

If you want to use `mvd` on the main ssb network use: `npm start -- --appname=ssb` and it will display the main ssb network if you already have an `.ssb` folder.

### history

`mvd` is coded from scratch, but may have some code overlap with [minbase](http://github.com/evbogue/minbase) and [patchless](http://github.com/dominictarr/patchless)

---
MIT
