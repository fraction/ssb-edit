# ssb-edit

> ssb-server plugin for simple mutable messages

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Install

```sh
ssb-server plugins.install ssb-edit
ssb-server plugins.enable ssb-edit
```

## Usage

```console
$ ssb-server get %DVSBTpCJWO18yeiRJ0uSf3al7R59aW3IfVZqEifiEeM=.sha256 | jq .content.text
[@kas](@RuNxm8SRujPcJx6GjtTQHp6hprAFv5voEkcvoAkB8Pk=.ed25519) [@Musickiller's work PC](@YtKbCLteE2BbMG0G6nyAsSYECOpE/Iz6XsNyohOCbic=.ed25519) Yes, we have [mutable messages](PtxLfewN03z3NJ0b+oBDeigt0z5IWTQIYoKyUB5/8VQ=.sha256) in [%mvd](%NPNNvcnTMZUFZSWl/2Z4XX+YSdqsqOhyPacp+lgpQUw=.sha256)

I decided to copy the entire message into each edit message, and then [do a diff in the front-end](%jUKpv+KlF8qLApmn2eauNcNGZtVLBRCkEDKZpAR+lCU=.sha256) to show you what has changed. 

There's been some talk about creating a mutable message flumeview, but my knowledge of how flume works isn't quite up to spec to implement that yet. 

It'd be cool to get mutable messages into more clients, so we can fix spelling errors and write wikis together. 
```

Currently this doesn't seem to be working in Patchbay, which I suspect would
require `sbot.get({ private: true })` on each message in the thread. This is
only confusing because `{ private }` really means "it's okay for plugins to
mutate this message", which was previously only used for decryption.

It's also worth noting that this does not work with flumedb views, as the
original message can't be mutated after it's been saved to the view store.

## Maintainers

[@fraction](https://github.com/fraction)

## Contributing

PRs accepted.

## License

MIT © 2018 Ev Bogue
