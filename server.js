var cfg = {
  PORT: 8888
};

//var http = require('http');

var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var spawn = require('child_process').spawn;

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

var SPEAKING = false;
var LASTLANG = "";

io.on("connection", function(socket) {
  console.log("Connected: " + socket.client.conn.id + " (" + socket.handshake.headers['user-agent'] + ")");

  socket.on("speak", function (message) {
    if(!SPEAKING) {
      SPEAKING = true;

      say(message, function () {
        console.log("Finished talking.");
      });

      message.timestamp = getTimestamp();

      if(LASTLANG === message.lang) {
        delete message.lang;
      } else {
        LASTLANG = message.lang;
      }

      socket.emit("chat", message);

      message.broadcast = socket.client.conn.id;
      socket.broadcast.emit("broadcast", message);
    }
  });

  socket.on("disconnect", function () {
    console.log("Disconnected: " + socket.client.conn.id + " (" + socket.handshake.headers['user-agent'] + ")");
  });
});

function getTimestamp() {
  var now = new Date();
  return [
    now.getHours(), ":",
    ("0" + now.getMinutes()).substr(-2), ":",
    ("0" + now.getSeconds()).substr(-2)
  ].join("");
}

function say (message, cb) {
  var cmdName = 'espeak';
  var options = [
    "-p75", // pitch
    "-z", // no pause on end
    "-s180", // speed in WPM
    "-k5", // capitals pitch
    "-x", // phonemes to STDOUT
    //"-v", "en-UK"
  ];

  if(message.hasOwnProperty("lang") && typeof message.lang === "string") {
    options.push("-v");
    options.push(message.lang);
  }

  options.push(message.text);

  console.log(message);

  var espeak = spawn(cmdName, options);
  espeak.on('error', function(err) { console.log(err); });
  espeak.stdout.on('data', function(data) { console.log(data.toString()); });
  espeak.on('close', function() {
    SPEAKING = false;
    if(typeof cb === "function") {
      cb();
    }
  });
}

http.listen(cfg.PORT, function () {
  console.log("Listening on *:" + cfg.PORT);
  say({"text": "I'm ready."});
});
