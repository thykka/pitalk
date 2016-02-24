PiTalk
========

PiTalk utilizes [espeak](http://linux.die.net/man/1/espeak) to vocalize messages sent by users via a web chat interface. Depends on [oggenc](http://linux.die.net/man/1/oggenc) and [aplay](http://linux.die.net/man/1/aplay) for transcoding and local playback (I've a Raspberry Pi connected to a speaker for this :)

Usage
=====

1. Clone this repo to your server, install dependencies, run ```node server.js```
2. Open one or more clients at your server's port 8888 with Chrome or similar

Todo
====
- Cross browser testing & style improvements
- Scheduled mute
- Nickname generator
