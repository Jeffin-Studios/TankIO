var land;

var myPlayer;
var players = {};
var bullets;

var enemies;
var enemiesTotal = 0;
var enemiesAlive = 0;
var enemyBullets;

var explosions;

var cover;

var cursors;

var obstacles = {};
var obstaclesTotal = 0;
var obstaclesAlive = 0;

// var Bullet = function(x, y, target, )
// var Obstacle = function(type, )

// var Bullet = function(x, y, target, )
// var Obstacle = function(type, )

var Obstacle = function(index, game, type, x, y) {
  this.id = index;
  this.game = game;
  this.type = type;
  this.x = x;
  this.y = y

  this.shadow = game.add.sprite(x, y, 'obstacle', 'shadow');
  this.object = game.add.sprite(x, y, 'obstacle', 'tank1');
  this.object.bringToTop();
  this.object.name = index.toString();

  this.object.anchor.set(0.5);
  this.shadow.anchor.set(0.5);

  game.physics.enable(this.object, Phaser.Physics.ARCADE);
  this.object.body.immovable = true;
};


var EnemyTank = function(index, game, target, follow = false) {

  var x = game.world.randomX;
  var y = game.world.randomY;

  this.game = game;
  this.health = 50;
  this.target = target;
  this.fireRate = 1000;
  this.nextFire = 0;
  this.alive = true;
  this.follow = follow;
  this.rebound = false;
  this.velocity = 100;
  this.attacked = false;

  this.shadow = game.add.sprite(x, y, 'enemy', 'shadow');
  this.tank = game.add.sprite(x, y, 'enemy', 'tank1');
  this.turret = game.add.sprite(x, y, 'enemy', 'turret');

  this.shadow.anchor.set(0.5);
  this.tank.anchor.set(0.5);
  this.turret.anchor.set(0.3, 0.5);

  this.tank.name = index.toString();
  game.physics.enable(this.tank, Phaser.Physics.ARCADE);
  this.tank.body.immovable = false;
  this.tank.body.collideWorldBounds = true;
  this.tank.body.bounce.setTo(1, 1);
  this.tank.body.maxVelocity.setTo(100, 100);

  this.tank.angle = game.rnd.angle();

  game.physics.arcade.velocityFromRotation(this.tank.rotation, this.velocity, this.tank.body.velocity);
};

EnemyTank.prototype.update = function() {
  this.shadow.x = this.tank.x;
  this.shadow.y = this.tank.y;
  this.shadow.rotation = this.tank.rotation;

  this.turret.x = this.tank.x;
  this.turret.y = this.tank.y;
  this.turret.rotation = this.tank.rotation;

  //Temporary function. Replace this with code on server that iterates through players list to find closest player to each enemy, and set that as its target
  if (myPlayer && !this.target) {
    this.target = myPlayer.tank;
  }
  if (this.target)  {
    var distance = this.game.physics.arcade.distanceBetween(this.tank, this.target);
    if (this.rebound && distance > 100) {
        this.follow = true;
        this.rebound = false;
    }
    if (this.target.alive && distance < 500) {
      this.turret.rotation = this.game.physics.arcade.angleBetween(this.tank, this.target);
      if (this.follow)  {
        this.tank.rotation = game.physics.arcade.moveToObject(this.tank, this.target, this.velocity);
        // this.tank.rotation = this.target.rotation;
      }
      if (this.attacked)  {
        this.attacked = false;
      }
    }
    else if (this.target.alive && this.attacked) {
      this.turret.rotation = this.game.physics.arcade.angleBetween(this.tank, this.target);
      this.tank.rotation = game.physics.arcade.moveToObject(this.tank, this.target, this.velocity);
    }
  }
};

EnemyTank.prototype.damage = function(impact = 1) {
  this.health -= impact;
  if (this.health <= 0) {
    this.alive = false;
    this.shadow.kill();
    this.tank.kill();
    this.turret.kill();
    return true;
  }
  return false;
};

EnemyTank.prototype.fire = function() {
  if (this.alive && this.target && this.target.alive && this.game.physics.arcade.distanceBetween(this.tank, this.target) < 300) {
    if (this.game.time.now > this.nextFire && enemyBullets.countDead() > 0) {
      this.nextFire = this.game.time.now + this.fireRate;
      var bullet = enemyBullets.getFirstDead();
      bullet.reset(this.turret.x, this.turret.y);
      bullet.rotation = this.game.physics.arcade.moveToObject(bullet, this.target, 500); //change this by setting rotation second argument to var point = {x:0, y:0}
    }
  }

};


var Player = function(id, game, bullets, x, y) {
  this.id = id;
  //  The base of our tank
  this.tank = game.add.sprite(x, y, 'tank', 'tank1');
  this.tank.anchor.setTo(0.5, 0.5);
  this.tank.animations.add('move', ['tank1', 'tank2', 'tank3', 'tank4', 'tank5', 'tank6'], 20, true);

  //  This will force it to decelerate and limit its speed
  game.physics.enable(this.tank, Phaser.Physics.ARCADE);
  this.tank.body.drag.set(0.2);
  this.tank.body.maxVelocity.setTo(400, 400);
  this.tank.body.collideWorldBounds = true;
  this.tank.body.immovable = false;

  //  Finally the turret that we place on-top of the tank body
  this.turret = game.add.sprite(x, y, 'tank', 'turret');
  this.turret.anchor.setTo(0.3, 0.5);

  //  A shadow below our tank
  this.shadow = game.add.sprite(x, y, 'tank', 'shadow');
  this.shadow.anchor.setTo(0.5, 0.5);
  this.tank.bringToTop();
  this.turret.bringToTop();

  this.velocity = 0;
  this.health = 100;
  this.maxHealth = 100;
  this.fireRate = 100;
  this.nextFire = 0;
  this.lifetime = 0;
  this.alive = true;
  this.slow = false;
  this.score = 0;

  this.bullets = bullets;
};

Player.prototype.update = function(local = true) {
  //  Position all the parts and align rotations
  if (!this.slow) {
    this.tank.body.maxVelocity.set(400,400);
  }

  this.shadow.x = this.tank.x;
  this.shadow.y = this.tank.y;
  this.shadow.rotation = this.tank.rotation;

  this.turret.x = this.tank.x;
  this.turret.y = this.tank.y;

  if (local)  {
    this.turret.rotation = game.physics.arcade.angleToPointer(this.turret);
  }
  if (this.lifetime < 1000) {
    this.lifetime += 1;
  }
  if (this.slow)  {
    this.tank.body.maxVelocity.set(100,100);
    this.slow = false;
  }
};

Player.prototype.damage = function(impact = 1) {
  if (this.lifetime > 200) {
    this.health -= impact;
    if (this.health <= 0) {
      this.alive = false;
      this.shadow.kill();
      this.tank.kill();
      this.turret.kill();
      return true;
    }
  }
  return false;
};

Player.prototype.fire = function() {
  if (this.alive && game.time.now > this.nextFire && this.bullets.countDead() > 0) {
    this.nextFire = game.time.now + this.fireRate;
    var bullet = this.bullets.getFirstExists(false);
    bullet.reset(myPlayer.turret.x, myPlayer.turret.y);
    bullet.rotation = game.physics.arcade.moveToPointer(bullet, 500, game.input.activePointer);
    bullet.expire = setTimeout(function() {
        bullet.kill();
    },800);
  }
};


/*============================End of Declaration==============================*/
/*============================================================================*/
/*============================================================================*/
/*============================================================================*/


function init() {
  game = new Phaser.Game(window.innerWidth - 500, window.innerHeight - 20, Phaser.AUTO, 'phaser-example', {
    preload: preload,
    create: create,
    update: update,
    render: render
  });

  // // put code inside interval in update function main loop
  // setInterval(function() {
  //   if (myPlayer) {
  //     // why not send the entire player object instead of justa few fields
  //     Client.sendMovement(Math.round(myPlayer.tank.x), Math.round(myPlayer.tank.y), myPlayer.velocity, myPlayer.tank.rotation, myPlayer.turret.rotation);
  //   }
  // },100);
}

init();

function preload() {
  game.load.atlas('tank', 'assets/games/tanks/tanks.png', 'assets/games/tanks/tanks.json');
  game.load.atlas('enemy', 'assets/games/tanks/enemy-tanks.png', 'assets/games/tanks/tanks.json');
  game.load.atlas('obstacle', 'assets/games/tanks/enemy-tanks.png', 'assets/games/tanks/tanks.json');
  game.load.image('cover', 'assets/games/tanks/logo.png');
  game.load.image('bullet', 'assets/games/tanks/bullet.png');
  game.load.image('earth', 'assets/games/tanks/scorched_earth.png');
  game.load.spritesheet('kaboom', 'assets/games/tanks/explosion.png', 64, 64, 23);

}

function create() {
  //  Resize our game world to be a 4000 x 4000 square
  game.world.setBounds(-2000, -2000, 4000, 4000);
  //  Our tiled scrolling background
  land = game.add.tileSprite(0, 0, 4000, 4000, 'earth');
  land.fixedToCamera = true;

  //  Our bullet group. With multiplayer, this will come from server
  bullets = game.add.group();
  bullets.enableBody = true;
  bullets.physicsBodyType = Phaser.Physics.ARCADE;
  bullets.createMultiple(30, 'bullet', 0, false);
  bullets.setAll('anchor.x', 0.5);
  bullets.setAll('anchor.y', 0.5);
  bullets.setAll('outOfBoundsKill', true);
  bullets.setAll('checkWorldBounds', true);
  bullets.setAll('expire', null);

  //  The enemies bullet group
  enemyBullets = game.add.group();
  enemyBullets.enableBody = true;
  enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
  enemyBullets.createMultiple(100, 'bullet');
  enemyBullets.setAll('anchor.x', 0.5);
  enemyBullets.setAll('anchor.y', 0.5);
  enemyBullets.setAll('outOfBoundsKill', true);
  enemyBullets.setAll('checkWorldBounds', true);

  // Create new player make this a call to server when multiplayer is implemented;
  // myPlayer = new Player(1, game, bullets, 0, 0);
  // Make enemies (this will be done by server on new connection)
  generateEnemies();
  Client.makeObstacles();

  //  Explosion pool
  explosions = game.add.group();

  for (var i = 0; i < 10; i++) {
    var explosionAnimation = explosions.create(0, 0, 'kaboom', [0], false);
    explosionAnimation.anchor.setTo(0.5, 0.5);
    explosionAnimation.animations.add('kaboom');
  }

  cover = game.add.sprite(0, 200, 'cover');
  cover.fixedToCamera = true;

  // bind down input with function to remove cover
  game.input.onDown.add(removeCover, this);
  game.camera.focusOnXY(0, 0);

  cursors = game.input.keyboard.createCursorKeys();
  upKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
  downKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
  leftKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
  rightKey = game.input.keyboard.addKey(Phaser.Keyboard.D);

  setInterval(function() {
    if (myPlayer && myPlayer.alive && myPlayer.health < myPlayer.maxHealth) {
      myPlayer.health+=1;
    }
  },1000);
}


function update() {
  //detect if bullet hits player

  if (myPlayer) {
    game.physics.arcade.overlap(enemyBullets, myPlayer.tank, bulletHitPlayer, null, this);

    if (cursors.left.isDown || leftKey.isDown) {
      myPlayer.tank.angle -= 4;
    }
    else if (cursors.right.isDown || rightKey.isDown) {
      myPlayer.tank.angle += 4;
    }

    if (cursors.up.isDown || upKey.isDown) {
      //  The speed we'll travel at
      myPlayer.velocity = Math.min(myPlayer.velocity += 30, 300);
      myPlayer.tank.animations.play('move');
    }
    else if (cursors.down.isDown || downKey.isDown) {
      myPlayer.velocity = Math.max(myPlayer.velocity -= 10, -100);
      myPlayer.tank.animations.stop('move');
    }
    else {
      if (myPlayer.velocity > 0) {
        myPlayer.velocity -= 4;
      }
      else {
        myPlayer.velocity += 4;
      }
    }

    // These controls are "ROTMG mode". Toggle this instead of default if user presses R key
    // if (cursors.left.isDown || leftKey.isDown) {
    //   if (0 <= myPlayer.tank.angle <= 180) {
    //     myPlayer.tank.angle -= 10;
    //   }
    //   else {
    //     myPlayer.tank.angle += 10;
    //   }
    //   myPlayer.velocity = Math.min(myPlayer.velocity += 30, 300);
    //   myPlayer.tank.animations.play('move');
    // }
    // else if (cursors.right.isDown || rightKey.isDown) {
    //   myPlayer.tank.angle = Math.min(myPlayer.tank.angle += 10, 0);;
    //   myPlayer.velocity = Math.min(myPlayer.velocity += 30, 300);
    //   myPlayer.tank.animations.play('move');
    // }
    //
    // if (cursors.up.isDown || upKey.isDown) {
    //   //  The speed we'll travel at
    //   myPlayer.tank.angle = Math.max(myPlayer.tank.angle += 10, -90);
    //   myPlayer.velocity = Math.min(myPlayer.velocity += 30, 300);
    //   myPlayer.tank.animations.play('move');
    // }
    // else if (cursors.down.isDown || downKey.isDown) {
    //   myPlayer.tank.angle = 90;
    //   myPlayer.velocity = Math.min(myPlayer.velocity += 30, 300);
    //   myPlayer.tank.animations.play('move');
    // }
    // else {
    //   if (myPlayer.velocity > 0) {
    //     myPlayer.velocity -= 4;
    //   }
    //   else {
    //     myPlayer.velocity += 4;
    //   }
    // }

    if (myPlayer.velocity != 0) {
      game.physics.arcade.velocityFromRotation(myPlayer.tank.rotation, myPlayer.velocity, myPlayer.tank.body.velocity);
    }

    if (game.input.activePointer.isDown) {
      myPlayer.fire();
    }

    if (myPlayer) {
      myPlayer.update();
      // why not send the entire player object instead of justa few fields
      Client.sendMovement(Math.round(myPlayer.tank.x), Math.round(myPlayer.tank.y), myPlayer.velocity, myPlayer.tank.rotation, myPlayer.turret.rotation);
    }
  }

  enemiesAlive = 0;
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].alive) {
      enemiesAlive++;
      // enemies[i].follow = true;
      if (myPlayer) {
        game.physics.arcade.collide(myPlayer.tank, enemies[i].tank, didCollide, null, this);
      }
      // if collision  {
      //   console.log("poop");
      // }
      game.physics.arcade.overlap(bullets, enemies[i].tank, bulletHitEnemy, null, this);
      enemies[i].update();
      enemies[i].fire();
    }
  }

  obstaclesAlive = 0;
  for (var i = 0; i < 50; i++) {
    if (obstacles[i]) {
      obstaclesAlive++;
      if (myPlayer) {
        game.physics.arcade.collide(myPlayer.tank, obstacles[i].object);
      }
      for (var j = 0; j < enemies.length; j++) {
        game.physics.arcade.collide(enemies[j].tank, obstacles[i].object);
      }

      game.physics.arcade.overlap(bullets, obstacles[i].object, bulletHitObstacle, null, this);
      game.physics.arcade.overlap(enemyBullets, obstacles[i].object, bulletHitObstacle, null, this);
    }
  }

  land.tilePosition.x = -game.camera.x;
  land.tilePosition.y = -game.camera.y;
}


function render() {
  game.debug.text('Enemies: ' + enemiesAlive + ' / ' + enemiesTotal, 32, 32);
  if (myPlayer) {
    game.debug.text("Player Health: " + myPlayer.health + " / " + myPlayer.maxHealth, 32, 64);
    game.debug.text("Player Score: " + myPlayer.score, 32, 96);
  }
}

function removeCover() {
  // unbind function and remove cover
  cover.kill();
  game.input.onDown.remove(removeCover, this);
  Client.makeNewPlayer();
}


function generateEnemies() {
  enemies = [];
  enemiesTotal = 50;
  enemiesAlive = 50;

  for (var i = 0; i < enemiesTotal; i++) {
    enemies.push(new EnemyTank(i, game, null, true));
    // enemies[i].tank.body.onWorldBounds = new Phaser.Signal();
    // enemies[i].tank.body.onWorldBounds.add(adjust, this);
  }
}

function bulletHitPlayer(tank, bullet) {
  bullet.kill();
  var destroyed = myPlayer.damage(5);
  if (destroyed) {
    var explosionAnimation = explosions.getFirstExists(false);
    explosionAnimation.reset(tank.x, tank.y);
    explosionAnimation.play('kaboom', 30, false, true);
    Client.death();
  }
}

function bulletHitEnemy(tank, bullet) {
  bullet.kill();
  clearTimeout(bullet.expire);
  enemies[tank.name].attacked = true;
  enemies[tank.name].target = myPlayer.tank;
  var destroyed = enemies[tank.name].damage(5);
  if (destroyed) {
    var explosionAnimation = explosions.getFirstExists(false);
    explosionAnimation.reset(tank.x, tank.y);
    explosionAnimation.play('kaboom', 30, false, true);
  }
}

function bulletHitObstacle(obstacle, bullet)  {
  bullet.kill();
  clearTimeout(bullet.expire);
  Client.damage('obstacle', obstacle.name, 5);
}

function didCollide (player, enemy) {
    enemies[enemy.name].target = myPlayer.tank;
    enemies[enemy.name].follow = false;
    enemies[enemy.name].rebound = true;
    myPlayer.slow = true;
}


/*========================Client-Server Communication=========================*/
/*============================================================================*/
/*============================================================================*/


var addThisPlayer = function(id,x,y){
  myPlayer = addPlayer(id,x,y);
  game.camera.follow(myPlayer.tank);
  // game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
  game.camera.focusOnXY(0, 0);
};

var addExistingPlayer = function(id,x,y){
 if (myPlayer.id == id)
     return;
 addPlayer(id,x,y);
};

var addPlayer = function(id,x,y){
 players[id] = new Player(id, game, bullets, x, y);
 return players[id];
};

var movePlayer = function(id,x,y,v,r,tr){
    var player = players[id];
    if (id == myPlayer.id || !player)  {
      return;
    }
    if (player.alive) {
      player.tank.rotation = r;
      player.tank.x = x;
      player.tank.y = y;
      player.velocity = v;
      player.turret.rotation = tr;
      player.update(false);
    }
};

var removePlayer = function(id){
    if (players[id]) {
        players[id].tank.destroy();
        players[id].shadow.destroy();
        players[id].turret.destroy();
        delete players[id];
    }
};

var generateObstacles = function(id, type, x, y) {
  obstacles[id] = new Obstacle(id, game, type, x, y);
};

var removeObstacle = function(id)  {
  var explosionAnimation = explosions.getFirstExists(false);
  explosionAnimation.reset(obstacles[id].x, obstacles[id].y);
  explosionAnimation.play('kaboom', 30, false, true);
  obstacles[id].object.destroy();
  obstacles[id].shadow.destroy();
  delete obstacles[id];
};
