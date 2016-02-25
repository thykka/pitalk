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

var Pi = function () {
  var pi = this;

  pi.speaking = false;
  pi.users = 0;
  pi.lastLang = "";
  pi.interval = null;

  pi.makeBeacon = function () {
    var b = {
      speaking: pi.speaking,
      users: pi.users,
      lang: pi.lastLang,
      timestamp: new Date()
    };
    return b;
  };
  pi.lastBeacon = pi.makeBeacon();

  pi.setGlobal = function (key, value, socket) {
    if(
      pi.hasOwnProperty(key) &&
      typeof value !== "undefined" &&
      typeof socket !== "undefined"
     ) {
      pi[key] = value;
      pi.sendBeacon(socket);
    }
  };

  pi.sendBeacon = function(socket) {
    var beacon = pi.makeBeacon();
    if(beacon.users === pi.lastBeacon.users) {
      delete beacon.users;
    }
    if(beacon.speaking === pi.lastBeacon.speaking) {
      delete beacon.speaking;
    }
    if(beacon.lang === pi.lastBeacon.lang) {
      delete beacon.lang;
    }
    try {
      socket.emit("beacon", beacon);
      socket.broadcast.emit("beacon", beacon);
    }
    catch(e) {
      console.log(e);
    }
    extend(pi.lastBeacon, beacon);
  };

  return pi;
};

var pi = new Pi();

io.on("connection", function(socket) {
  pi.setGlobal("users", pi.users + 1, socket);

  var username = generateSpiritAnimal();
  console.log([
    "- (",
    pi.users,
    ") ",
    username,
    " [",
    socket.request.connection.remoteAddress,
    "] (",
    socket.request.headers["user-agent"],
    ")"].join(""));

  socket.on("speak", function (message) {
    if(!pi.speaking) {
      console.log(username + "> " + message.text);
      pi.setGlobal("speaking", true, socket);
      say(message, function(msg, filename) {
        play(filename, function () {
          pi.setGlobal("speaking", false, socket);
        });
        wavToOgg(filename, function(file, newFile) {
          deleteFile(file);

          socket.emit("sound", newFile.replace("temp/", ""));
          socket.broadcast.emit("sound", newFile.replace("temp/", ""));

          setTimeout(function() {
            deleteFile(newFile);
          }, 1000 * 60 * 3);
        });
      });

      message.timestamp = getTimestamp();
      if(pi.lastLang === message.lang) {
        delete message.lang;
      } else {
        pi.setGlobal("lastLang", message.lang, socket);
      }
      message.username = username;
      socket.emit("chat", message);
      delete message.username;

      message.broadcast = username;
      socket.broadcast.emit("broadcast", message);
    }
  });

  socket.on("disconnect", function () {
    pi.setGlobal("users", pi.users - 1, socket);
    console.log([
      "- (",
      pi.users,
      ") ",
      username,
      " [",
      socket.request.connection.remoteAddress,
      "] (",
      socket.request.headers["user-agent"],
      ")"].join(""));
  });
});

function extend(destination, source) {
  for (var property in source) {
    if (source[property] && source[property].constructor &&
     source[property].constructor === Object) {
      destination[property] = destination[property] || {};
      arguments.callee(destination[property], source[property]);
    } else {
      destination[property] = source[property];
    }
  }
  return destination;
}

function generateSpiritAnimal () {
  var nature = "acceptable addicted aggressive agile alcoholic alienated alluring anxious assertive astonishing asymmetric attentive authentic awesome awkward beautiful behemothic beloved big biodegradable bitter black blond blue bold bony bootilicious bored bossy bouncy brainy brisk brown buff busty busy buzzing calculating calm camouflaged careful carnivorous cautious cerebral charming cheeky cheery chic chilling chubby classy clingy clueless clumsy colorless colossal comical compassionate competent concerned confident confusing conservative constipated contemplative conventional cool cosmic courteous coy creatie credible creepy crimson crooked crouching crying cuddly curious curvy cute cyan cylindrical dangerous dapper dark daunting dead delicate delightful dependable determined devoted digital dimwitted dirty discreet discrete disfigured disloyal distant distressed dominant dramatic dreaded dreadful easy-going ecstatic edible educated eery elastic elated elderly electrifying elegant embarrassing embellished emotional enchanted endothermic enormous envious epic evil exciting exotic extraordinary extraterrestrial extroverted fabulous fancy fascinating fast fearless feisty feminine ferocious fickle firm flaky flamboyant flawless floating flourishing fly flying foolhardy foolish formal formidable forsaken fragrant freaky friendly frigid frivolous frosty funky funny furry gargantuan geeky generous gentle genuine geometric glamorous glittering gloomy goofy gorgeous grandiose grateful gray green grotesque growing grumpy gullible hammer-headed hard hard-working harsh hasty hateful healthy heavenly herbivorous hidden hollow hopeful horrible howling huge humble humiliating humongous hungry hunting hypnotic idealistic idiotic idle ignorant illegal imaginary immense impatient important impossible impotent impractical indigo infamous infinite infrared insane insignificant intelligent intense interesting intimidating introverted invisible jaded jagged jittery joking jolly joyful jubilant jumping jumpy kind klutzy laid-back lame lascivious laughing lazy legendary legitimate levitating liberal lighthearted lone lonely long lost loud lovely loyal lucky lusty luxurious majestic maned mangy masculine massive mature mediocre mellow metallic microscopic mild miserable misty morphing muscular mysterious naive narrow nasty naughty needy neglected nervous nifty nocturnal noteworthy noxious nutritious nutty obedient obvious offensive old-fashioned omnivorous optimal optimistic opulent orange ordinary original outlandish pathetic peaceful peppery perky persistent pessimistic petite pink playful pleasant plump polite pompous posh powerful predictable private probable profitable promiscuous proud prudent pulchritudinous pungent puzzling quantum questionable quick quiet quixotic radiant radical rare realistic reckless reclusive red regular ridiculous rotten rubbery rude salty sanguine scaly scary scruffy self-assured selfish sensual sexy sharp short shy silent silky singing sitting sleepy slender sluggish slutty small smart snappy snazzy sneaky snobby soft soulful sour spaced-out spicy spiffy spiteful spunky stale standing stealthy sticky stingy stinky stoic stubborn stupendous stuttering suave superb swanky sweet swell swinging symmetric tasty tempting three-legged tiny transparent trembling trippy trivial turqoise ugly ultramarine ultraviolet uncanny uncommon unforgiving unpredictable vast vengeful vigorous violet voluptuous vulgar warm well-hung white wide wise wobbly yellow".split(" ");
  var animal = "aardvark alligator alpaca anaconda angelfish ant anteater antilope aphid arachne armadillo axolotl baboon badger baphomet bat batfish bear beaver bee beetle binturong bison boar bobcat bonobo boomslang bulldog butterfly cabbit camel capybara cat caterpillar centaur centipede cerberus chicken chihuahua chimera chimpanzee chinchilla chinook chipmunk chrysalis chupacabra cockatrice cockroach colibri corgi cougar cow coyote crab crocodile cuttlefish deer degu dhole dodo dog dolphin dove dragon duck dugong eagle echidna echidna eel elephant emu faun fennec ferret flamingo fly fox frog gecko gerbil gibbon giraffe goat goose gopher gorilla greyhound griffin gull hamster hare harpy hawk hedgehog hen herring hippo horse hummingbird hyena iguana jackal jaguar jellyfish kakapo kangaroo kinkajou kiwi koala koi kookaburra ladybug lemming lemur leopard liger lion llama lobster louse lynx magpie manatee manta manticore manul marmoset mastiff meerkat millipede mink minotaur mite mole mongoose monkey moose moth mouse mule narwhal newt nightingale numbat ocelot octopus okapi olm opah opossum orangutan orc ostrich otter owl ox oyster pademelon panda pangolin panther parrot peacock pegasus pelican penguin pheasant phoenix pig pika piranha platypus pointer polecat pony poodle porcupine prawn pterodactyl puffin pug puma quail quetzal rabbit raccoon rat rattlesnake reindeer rhinoceros robin rooster rottweiler salamander saola satyr scorpion sea-lion seagull seal serval shark sheep skunk sloth slug snail snake solendon spaniel sparrow sphinx spider squid squirrel starfish stingray sunfish swan tapir tarantula tarsier termite terrier tetra tick tiger toad tortoise toucan triceratops trout turkey turtle tyrannosaurus unicorn velociraptor viper vulture wallaby wallaroo walrus warg weasel whale wolf wolverine wombat woodpecker worm wrasse yak zebra zonkey".split(" ");
  var name = "";
  name += nature[Math.floor(Math.random() * nature.length)];
  name += " " + animal[Math.floor(Math.random() * animal.length)];
  // name = name.charAt(0).toUpperCase() + name.substr(1);
  return name;
}

function getTimestamp() {
  var now = new Date();
  return [
    now.getHours(), ":",
    ("0" + now.getMinutes()).substr(-2)
  ].join("");
}

function play (filename, cb) {
  var aplay = spawn('aplay', [filename]);
  aplay.on('error', function(err) { /**/ });
  aplay.stdout.on('data', function() { /**/  });
  aplay.on('close', function() {
    // SPEAKING = false;
    if(typeof cb === "function") {
      cb(filename);
    }
  });
}

function wavToOgg (file, cb) {
  var options = ["-Q", "-q", "1", file];
  var oggEnc = spawn('oggenc', options);
  oggEnc.on('error', function(err) { /**/ });
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
    if(err) { /**/ }
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

  if(message.text.length > 250) {
    message.text = message.text.substring(0, 200);
  }

  options.push(message.text);

  var espeak = spawn(cmdName, options);
  espeak.on('error', function(err) { /**/ });
  espeak.stdout.on('data', function(data) { console.log(data.toString()); });
  espeak.on('close', function() {
    if(typeof cb === "function") {
      cb(message, filename);
    }
  });
}

http.listen(cfg.PORT, function () {
  console.log("Listening on *:" + cfg.PORT);
});
