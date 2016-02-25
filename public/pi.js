(function(io) {
  "use strict";
  var Pi = {};

  var greeting = [
    "", "", "", "", "", "", "", "", "", "", "", "", "Hello, I'm a talking Raspberry Pi!", "",
    "I'll speak aloud whatever you tell me to.",
    "Just type your message below and press enter!", "", "", ""
  ].join("\n");


  Pi.handleInput = function (evt) {
    // enter key sends
    if(evt.charCode === 13) {
      Pi.handleSend(evt);
    }
  };

  Pi.handleLangChange = function (evt) {
    Pi.inEl.focus();
  };

  Pi.init = function () {
    Pi.outEl = document.getElementById("pi-output");
    Pi.inEl = document.getElementById("pi-command");
    Pi.langEl = document.getElementById("pi-lang");
    Pi.btnEl = document.getElementById("pi-send");
    Pi.playerEl = document.getElementById("pi-player");
    Pi.usersEl = document.getElementById("pi-users");
    Pi.inEl.addEventListener("keypress", Pi.handleInput);
    Pi.langEl.addEventListener("change", Pi.handleLangChange);
    Pi.btnEl.addEventListener("click", Pi.handleSend);

    Pi.socket = io();
    Pi.socket.on("chat", function(message) {
      Pi.handleReceiveChat(message, false);
    });
    Pi.socket.on("broadcast", function(message) {
      Pi.handleReceiveChat(message, true);
    });
    Pi.socket.on("sound", function(filename) {
      Pi.playerEl.pause();
      Pi.playerEl.src = filename;
      Pi.playerEl.play();
    });
    Pi.socket.on("beacon", function(beacon) {
      console.log(beacon);
      if(typeof beacon === "object") {
        if(beacon.hasOwnProperty("users")) {
          Pi.usersEl.innerHTML = beacon.users + " user" + (beacon.users == 1 ? "" : "s") + " online";
        }
        if(beacon.hasOwnProperty("blocked")) {
          if(beacon.blocked) {
            Pi.btnEl.setAttribute("disabled", "true");
          }
          else {
            Pi.btnEl.removeAttribute("disabled");
          }
        }
      }
    });

    window.Pi = Pi;

    Pi.pause = 1;
    Pi.capitals = 3;
    Pi.speed = 120;
    Pi.pitch = 48;

    Pi.printMessage(greeting);
    Pi.inEl.focus();
  };

  Pi.printMessage = function (message) {
    if(message.length > 0) {
      Pi.PRINTING = true;

      var letter = message[0];
      message = message.substring(1);

      setTimeout(function() {
        Pi.outEl.innerHTML += letter;

        // scroll to bottom if needed
        var scrollDiff = Pi.outEl.scrollTop + Pi.outEl.offsetHeight - Pi.outEl.scrollHeight;
        if(scrollDiff < 0) {
          Pi.outEl.scrollTop -= scrollDiff;
        }

        Pi.printMessage(message);
      }, 5);
    }
    else {
      Pi.PRINTING = false;
    }
  };

  Pi.handleSend = function (evt) {
    if(Pi.inEl.value !== "") {
      Pi.socket.emit("speak", {
        "text": Pi.inEl.value,
        "lang": Pi.langEl.options[Pi.langEl.selectedIndex].value,
        "pitch": Pi.pitch,
        "pause": Pi.pause,
        "capitals": Pi.capitals,
        "speed": Pi.speed
      });
      Pi.inEl.value = "";
    }
    Pi.inEl.focus();
  };

  Pi.timeStamp = function () {
    var now = new Date();
    return [
      now.getHours(), ":",
      ("0" + now.getMinutes()).substr(-2)
    ].join("");
  };

  Pi.handleReceiveChat = function (message, broadcast) {
    var rowEl = document.createElement("div");
    rowEl.classList.add("row");

    var timestampEl = document.createElement("span");
    timestampEl.classList.add("timestamp");
    timestampEl.innerHTML = message.timestamp ?
      message.timestamp :
      Pi.timeStamp();
    rowEl.appendChild(timestampEl);

    var nicknameEl = document.createElement("span");
    nicknameEl.classList.add("nickname");
    if (message.hasOwnProperty("broadcast")) {
      nicknameEl.innerHTML = message.broadcast;
    }
    else if (message.hasOwnProperty("username")) {
      nicknameEl.innerHTML = message.username;
    }
    else {
      nicknameEl.innerHTML = "???";
    }
    /*
    nicknameEl.innerHTML =
        message.broadcast :
        Pi.langEl.options[Pi.langEl.selectedIndex].value === "fi" ?
          "sinä" :
          "you";
    */
    rowEl.appendChild(nicknameEl);

    var textEl = document.createElement("span");
    textEl.classList.add("text");
    textEl.innerHTML = message.text;
    rowEl.appendChild(textEl);

    if(typeof message.lang === "string") {
      var langEl = document.createElement("span");
      langEl.classList.add("lang");
      langEl.innerHTML = message.lang;
      rowEl.appendChild(langEl);
    }

    Pi.outEl.appendChild(rowEl);
    var scrollDiff = Pi.outEl.scrollTop + Pi.outEl.offsetHeight - Pi.outEl.scrollHeight;
    if(scrollDiff < 0) {
      Pi.outEl.scrollTop -= scrollDiff;
    }
  };

  window.addEventListener("load", Pi.init);
})(io);
