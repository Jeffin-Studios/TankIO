var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.htm');
});

server.lastPlayerID = 0;
server.lastBulletID = 0;
server.playersList = [];
server.obstaclesList = {};

server.listen(process.env.PORT || 8081, function() {
  console.log('Listening on ' + server.address().port);
});

var Bullet = function(id, pid, x, y, v, r, tr) {
  this.dt = Date.now();
  this.id = id;
  this.pid = pid;
  this.x = x;
  this.y = y;
  this.v = v;
  this.r = r;
  this.tr = tr;
  return this;
};

var Player = function(id, x, y) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.v = 0;
  this.r = 0;
  this.tr = 0;
  //track health as field too?
  return this;
};

var Obstacle = function(index, type, x, y) {
  this.id = index;
  this.type = type;
  this.x = x;
  this.y = y;
  this.health = 200;
  return this;
};

Obstacle.prototype.damage = function(impact = 1) {
  this.health -= impact;
  if (this.health <= 0) {
    return true;
  }
  return false;
};

var gSocket = null;


function generateObstacles() {
  for (var i = 0; i < 100; i++) {
    if (i < 80) {
      server.obstaclesList[i] = new Obstacle(i, 'tree', randomInt(-2000, 2000), randomInt(-2000, 2000));
    }
    else {
      server.obstaclesList[i] = new Obstacle(i, 'boulder', randomInt(-2000, 2000), randomInt(-2000, 2000));
    }
  }
}

generateObstacles();

io.on('connection', function(socket) {
  gSocket = socket;
  var obstacles = server.obstaclesList;
  socket.on('makeObstacles', function(){socket.emit("allObstacles", obstacles);});
  socket.on('newplayer', function() {
    socket.player = new Player(
      server.lastPlayerID++,
      randomInt(-1000, 1000),
      randomInt(-1000, 1000)
    );
    // server.playersList.push(socket.player);
    socket.emit('thisplayer', socket.player);
    socket.broadcast.emit('allplayers', getAllPlayers()); //change to socket.player instead of getAllPlayers() and see if it still works
    socket.emit('allplayers', getAllPlayers());

    socket.on('move', function(data) {
      //            console.log('click to '+data.x+', '+data.y);
      socket.player.x = data.x;
      socket.player.y = data.y;
      socket.player.v = data.v;
      socket.player.r = data.r;
      socket.player.tr = data.tr;
      socket.broadcast.emit('move', socket.player);
    });

    socket.on('shoot', function(data) {
      var bullet = new Bullet(Object.keys(bullets).length, data.pid, data.x, data.y, data.v, data.r, data.tr);
      bullets.push(bullet);
      socket.broadcast.emit('shoot', bullet);
      socket.emit('shoot', bullet);
    });

    socket.on('damage', function(data) {
      if (data.type == 'obstacle' && server.obstaclesList[data.id])  {
        var destroyed = server.obstaclesList[data.id].damage(data.impact);
        if (destroyed)  {
          io.emit('removeObstacle', {id: data.id});
          delete server.obstaclesList[data.id]
        }
      }
    });

    socket.on('death', function(data) {
      // server.playersList[socket.player.id] = null;
      io.emit('removePlayer',socket.player.id);
    });

    socket.on('disconnect', function() {
      // server.playersList[socket.player.id] = null;
      io.emit('removePlayer',socket.player.id);
    });
  });

  socket.on('test', function() {
    console.log('test received');
  });
});




function getAllPlayers() {
  var players = [];
  Object.keys(io.sockets.connected).forEach(function(socketID) {
    var player = io.sockets.connected[socketID].player;
    if (player) players.push(player);
  });
  return players;
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
