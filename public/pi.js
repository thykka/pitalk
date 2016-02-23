(function(io) {
  "use strict";
  var Pi = {};

  var greeting = [
    "Hello, I'm a talking Raspberry Pi!", "",
    "I'll speak aloud whatever you tell me to.",
    "Just type your message below and press enter!", "",
    "NOTE: While I speak quite loudly, my voice is not sent back to you over the Internet. Therefore you can only hear me if you're actually visiting my home.", ""
  ].join("\n");


  Pi.handleInput = function (evt) {
    // enter key sends
    if(evt.charCode === 13) {
      Pi.handleSend(evt);
    }
  };

  Pi.init = function () {
    Pi.outEl = document.getElementById("pi-output");
    Pi.inEl = document.getElementById("pi-command");
    Pi.btnEl = document.getElementById("pi-send");
    Pi.inEl.addEventListener("keypress", Pi.handleInput);
    Pi.btnEl.addEventListener("click", Pi.handleSend);

    Pi.socket = io();
    Pi.socket.on("chat", function(message) {
      Pi.handleReceiveChat(message, false);
    });
    Pi.socket.on("broadcast", function(message) {
      Pi.handleReceiveChat(message, true);
    });

    window.Pi = Pi;

    Pi.printMessage(greeting);
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
    Pi.socket.emit("speak", {
      "text": Pi.inEl.value
    });
    Pi.inEl.value = "";
    Pi.inEl.focus();
  };

  Pi.timeStamp = function () {
    var now = new Date();
    return [
      now.getHours(), ":",
      ("0" + now.getMinutes()).substr(-2), ":",
      ("0" + now.getSeconds()).substr(-2)
    ].join("");
  };

  Pi.handleReceiveChat = function (message, broadcast) {
    if(!Pi.PRINTING) {
      Pi.printMessage([
        "\n",
        !message.timestamp ? Pi.timeStamp() : message.timestamp,
        !message.broadcast ? " <you> " : " <???> ",
        message.text
      ].join(""));
    }
    else {
      // prevent printing multiple messages at the same time
      setTimeout(function() {
        Pi.handleReceiveChat(message);
      }, 500);
    }
  };

  window.addEventListener("load", Pi.init);
})(io);
