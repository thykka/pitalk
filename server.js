var cfg = {
  PORT: 8008
};

var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on("connection", function(socket) {
  console.log("Connected: " + socket.client.conn.id + " (" + socket.handshake.headers['user-agent'] + ")");

  socket.on("ytURL", function (msg) {
    console.log("Received and submitting video ID:", msg);
    io.emit("ytURL", msg);
  });

  socket.on("disconnect", function () {
    console.log("Disconnected: " + socket.client.conn.id + " (" + socket.handshake.headers['user-agent'] + ")");
  });
});

http.listen(cfg.PORT, function () {
  console.log("Listening on *:" + cfg.PORT);
});
