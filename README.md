remoteyt
========

This simple socket.io app allows playing and changing YouTube videos remotely.

Usage
=====

1. Clone this repo to your server, install npm dependencies, run ```node server.js```
2. Open one or more clients at your server's port 8008
3. Paste a youtube video URL or ID to the input field and submit
4. The specified video, if found, will begin to play on all connected clients

Todo
====

- Implement remote playback control (play/pause/seek/volume etc.)
- Implement playlists/autoplay
