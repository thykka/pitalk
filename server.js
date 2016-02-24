var cfg = {
  PORT: 8888
};

//var http = require('http');
var fs = require("fs");
var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var spawn = require('child_process').spawn;

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));
app.use(express.static('temp'));

var SPEAKING = false;
var LASTLANG = "";

io.on("connection", function(socket) {
  console.log("Connected: " + socket.client.conn.id + " (" + socket.handshake.headers['user-agent'] + ")");

  socket.on("speak", function (message) {
    if(!SPEAKING) {
      SPEAKING = true;

      say(message, function (msg, filename) {
        // finished talking
        play(filename, function(filename) {
          console.log("sound played. transcoding to ogg..");

          wavToOgg(filename, function(file, newFile) {

            console.log("encoded. deleting original & serving to client...");
            deleteFile(file);

            socket.emit("sound", newFile.replace("temp/", "") );
            socket.broadcast.emit("sound", newFile.replace("temp/", "") );

            console.log("Setting 1min delete timer for " + newFile);
            setTimeout(function() {
              console.log("deleting" + newFile);
              deleteFile(newFile);
            }, 1000 * 60);
          });
        });
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
    ("0" + now.getMinutes()).substr(-2)
  ].join("");
}

function play (filename, cb) {
  console.log(filename);
  var aplay = spawn('aplay', [filename]);
  aplay.on('error', function(err) { console.log(err); });
  aplay.stdout.on('data', function() { /**/  });
  aplay.on('close', function() {
    SPEAKING = false;
    if(typeof cb === "function") {
      cb(filename);
    }
  });
}

function wavToOgg (file, cb) {
  var options = ["-Q", "-q", "1", file];
  var oggEnc = spawn('oggenc', options);
  oggEnc.on('error', function(err) { console.log(err); });
  oggEnc.on('data', function(data) { /**/ });
  oggEnc.on('close', function () {
    var newFile = file.replace(".wav", ".ogg");
    if(typeof cb === "function") {
      cb(file, newFile);
    }
  });
}

function deleteFile (file) {
  fs.unlink(file, function(err) {
    if(err) throw err;
  });
}

function say (message, cb) {
  var cmdName = 'espeak';
  var options = [
    "-z", // no pause on end
  ];

  if(message.hasOwnProperty("pause") && typeof message.pause === "number") {
    options.push("-g" + Math.floor(Math.min(Math.max(0, message.pause), 99)));
  }

  if(message.hasOwnProperty("capitals") && typeof message.capitals === "number") {
    options.push("-k" + Math.floor(Math.min(Math.max(1, message.capitals), 250)));
  }

  if(message.hasOwnProperty("pitch") && typeof message.pitch === "number") {
    options.push("-p" + Math.floor(Math.min(Math.max(0, message.pitch), 99)));
  }

  if(message.hasOwnProperty("speed") && typeof message.speed === "number") {
    options.push("-s" + Math.floor(Math.min(Math.max(80, message.speed), 450)));
  }

  if(message.hasOwnProperty("lang") && typeof message.lang === "string") {
    options.push("-v");
    options.push(message.lang);
  }

  options.push("-w");
  var filename = "temp/" + Math.random().toString(36).substr(2, 5) + ".wav";
  options.push(filename);

  options.push(message.text);

  console.log(message);

  var espeak = spawn(cmdName, options);
  espeak.on('error', function(err) { console.log(err); });
  espeak.stdout.on('data', function(data) { console.log(data.toString()); });
  espeak.on('close', function() {
    //SPEAKING = false;
    if(typeof cb === "function") {
      cb(message, filename);
    }
  });
}

http.listen(cfg.PORT, function () {
  console.log("Listening on *:" + cfg.PORT);
});
