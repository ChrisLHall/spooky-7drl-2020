var grid = document.querySelector('#grid');
var WIDTH = 20;
var HEIGHT = 20;
var CAM_WIDTH = 15;
var CAM_HEIGHT = 11;
var camX = 0;
var camY = 0;

var level = 1;

var you = {
  gfx: "✌",
  x: 5,
  y: 5,
  health: 5,
  maxHealth: 5,
  hasKey: false,
};
var keyObj = null;
var exitObj = null;

var bg = []; // populated in startGame

var ROOMS = [
  [[1,1,0,1,1,1,],
   [1,0,0,0,0,1,],
   [1,0,0,0,0,0,],
   [0,0,0,0,0,1,],
   [1,1,1,0,1,1,]]
];
var ROOM_WALLS = ["🆘", "➿"];

var environment = [];

var entityTemplate = {
  type: "butts",
  gfx: [["💤"]],
  x: 0,
  y: 0,
};
var entities = [];
var entitiesToDelete = [];
var entityTypeToGfx = {
  "key": [["🗝"]],
  "exit": [["🚪"]],
  "rat": [["🐁"]],
  "slime": [["⚛","⚛"],
            ["⚛","⚛"]],
}

// todo moving+placing big entities
var entityUpdateFunctions = {
  "key": updateKey,
  "exit": updateExit,
  "rat": updateMoveRandom,
  "slime": updateMoveRandom,
};

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min));
}

// shallow copy
function copyFromTemplate(obj, template) {
  return Object.assign(obj, template); // test??
}

function entityWidth(entity) {
  return entity.gfx[0].length;
}

function entityHeight(entity) {
  return entity.gfx.length;
}

function entityIsHostile(entity) {
  return entity.type === "rat" || entity.type === "slime";
}

var FLOOR_TILES = ["▫", "⬜", "⚪"]; // todo
function generateBG(width, height) {
  var result = [];
  for (var r = 0; r < height; r++) {
    var row = [];
    for (var c = 0; c < width; c++) {
      row.push(choose(FLOOR_TILES));
    }
    result.push(row);
  }
  return result;
}

// return an array of objects that are each 1 grid tile
function generateWalls(width, height) {
  var result = [];
  for (var y = 0; y < height; y++) {
    var row = [];
    for (var x = 0; x < width; x++) {
      row.push(null);
    }
    result.push(row);
  }
  var roomWidth = ROOMS[0][0].length;
  var roomHeight = ROOMS[0].length;
  for (var k = 0; k < height / roomHeight; k++) {
    var startY = 2 + k * (roomHeight - 1);
    var endY = 2 + (k + 1) * (roomHeight - 1) - 1;
    if (endY >= height) break;
    for (var j = 0; j < width / roomWidth; j++) {
      var startX = 2 + j * (roomWidth - 1);
      var endX = 2 + (j + 1) * (roomWidth - 1) - 1;
      if (endX >= width) break;

      var room = choose(ROOMS);
      var wall = choose(ROOM_WALLS);
      placeRoom(result, startX, startY, room, wall);
    }
  }

  return result;
}

function placeRoom(envArray, xStart, yStart, roomArray, wallTile) {
  for (var y = 0; y < roomArray.length; y++) {
    for (var x = 0; x < roomArray[y].length; x++) {
      var thisTile = roomArray[y][x] === 1 ? wallTile : null;
      envArray[yStart + y][xStart + x] = thisTile;
    }
  }
}

function placeKey(entities, xMin, yMin, xMax, yMax) {
  for (var attempt = 0; attempt < 100; attempt++) {
    // try to place 100 times
    var x = randomInt(xMin, xMax);
    var y = randomInt(yMin, yMax);
    if (!isWall(x, y)) {
      keyObj = copyFromTemplate({}, entityTemplate);
      keyObj.type = "key";
      keyObj.gfx = entityTypeToGfx["key"];
      keyObj.x = x;
      keyObj.y = y;

      entities.push(keyObj);
      break;
    }
  }
}

function placeExit(entities, xMin, yMin, xMax, yMax, minKeyDist) {
  for (var attempt = 0; attempt < 100; attempt++) {
    // try to place 100 times
    var x = randomInt(xMin, xMax);
    var y = randomInt(yMin, yMax);
    var keyDist = Math.abs(x - keyObj.x) + Math.abs(y - keyObj.y);
    if (keyDist > minKeyDist && !isWall(x, y)) {
      exitObj = copyFromTemplate({}, entityTemplate);
      exitObj.type = "exit";
      exitObj.gfx = entityTypeToGfx["exit"];
      exitObj.x = x;
      exitObj.y = y;

      entities.push(exitObj);
      break;
    }
  }
}

function placeMonsters(entities, count, type) {
  for (var j = 0; j < count; j++) {
    var monster = copyFromTemplate({}, entityTemplate);
    monster.type = type;
    monster.gfx = entityTypeToGfx[type];
    monster.x = 5;
    monster.y = 5;
    var width = entityWidth(monster);
    var height = entityHeight(monster);
    for (var attempt = 0; attempt < 100; attempt++) {
      // try to place 10 times
      var x = randomInt(0, WIDTH);
      var y = randomInt(0, HEIGHT);
      if (!isWall(x, y, width, height) && entitiesAt(x, y, width, height).length === 0) {
        monster.x = x;
        monster.y = y;
        break;
      }
    }
    entities.push(monster);
  }
}

function buildLevel(level) {
  bg = generateBG(WIDTH, HEIGHT);
  environment = generateWalls(WIDTH, HEIGHT);
  entities = [];
  placeKey(entities, 3, 3, WIDTH - 3, HEIGHT - 3);
  placeExit(entities, 3, 3, WIDTH - 3, HEIGHT - 3, 10);
  placeMonsters(entities, 15, "rat");
  placeMonsters(entities, 2, "slime");
  you.x = 0;
  you.y = 0;
  // todo place YOU
}

// ENTRY POINT
function startGame() {
  buildLevel(1);

  renderGrid();
}

var stopped = false;
function gameLoop() {
  if (!stopped) {
  }
  entitiesToDelete = [];

  // update
  for (var j = 0; j < entities.length; j++) {
    var entity = entities[j];
    if (entity.type in entityUpdateFunctions) {
      entityUpdateFunctions[entity.type](entity);
    }
  }

  // now delete
  for (var j = 0; j < entitiesToDelete.length; j++) {
    var entity = entitiesToDelete[j];
    var index = entities.indexOf(entity);
    if (-1 !== index) {
      entities.splice(index, 1);
    }
  }

  renderGrid();
  //setTimeout(gameLoop, FRAME_TIME);
}

function renderGrid() {
  camX = clamp(you.x - Math.floor(CAM_WIDTH / 2), 0, WIDTH - CAM_WIDTH);
  camY = clamp(you.y - Math.floor(CAM_HEIGHT / 2), 0, HEIGHT - CAM_HEIGHT);

  var frame = [];
  for (var j = 0; j < CAM_HEIGHT; j++) {
    var frameRow = []
    var y = j + camY;
    for (var k = 0; k < CAM_WIDTH; k++) {
      var x = k + camX;
      var block = null;
      if (!block) {
        block = environment[y][x];
      }
      if (!block) {
        block = bg[y][x];
      }
      frameRow.push(block);
    }
    frame.push(frameRow);
  }

  for (var idx = 0; idx < entities.length; idx++) {
    var entity = entities[idx];
    for (var j = 0; j < entity.gfx.length; j++) {
      var y = entity.y + j - camY;
      if (y < 0 || y >= CAM_HEIGHT) continue;
      for (var k = 0; k < entity.gfx[j].length; k++) {
        var x = entity.x + k - camX;
        if (x < 0 || x >= CAM_WIDTH) continue;
        frame[y][x] = entity.gfx[j][k];
      }
    }
  }

  var playerX = you.x - camX;
  var playerY = you.y - camY;
  if (playerX >= 0 && playerX < CAM_WIDTH
      && playerY >= 0 && playerY < CAM_HEIGHT) {
    frame[playerY][playerX] = you.gfx;
  }

  var str = "";
  for (var j = 0; j < frame.length; j++) {
    for (var k = 0; k < frame[j].length; k++) {
      str += frame[j][k];
    }
    str += "<br>";
  }
  // TODO health?
  var healthStr = "";
  for (var j = 0; j < you.maxHealth; j++) {
    healthStr += you.health > j ? "💙" : "🖤";
  }
  str += "Level " + level + "&nbsp;&nbsp;&nbsp;" + healthStr + "&nbsp;&nbsp;&nbsp;" + (you.hasKey ? "🗝" : "&nbsp;") + "<br>";
  grid.innerHTML = twemoji.parse(str);
}

function isWall(x, y, width, height) {
  width = width || 1;
  height = height || 1;
  if (x < 0 || y < 0 || x + width > WIDTH || y + height > HEIGHT) return true;

  for (var j = 0; j < height; j++) {
    for (var k = 0; k < width; k++) {
      if (environment[y + j][x + k]) return true;
    }
  }
  return false;
}

function isYou(x, y, width, height) {
  width = width || 1;
  height = height || 1;
  
  return (you.x >= x && you.x < x + width && you.y >= y && you.y < y + height);
}

function entitiesAt(x, y, width, height, self) {
  var result = [];
  width = width || 1;
  height = height || 1;
  self = self || null;

  for (var j = 0; j < entities.length; j++) {
    var entity = entities[j];
    if (entity === self) continue;
    if (x < entity.x + entityWidth(entity) && entity.x < x + width
        && y < entity.y + entityHeight(entity) && entity.y < y + height) {
      result.push(entity);
    }
  }
  return result;
}

function tryMovePlayer(dx, dy) {
  if (!isWall(you.x + dx, you.y + dy)) {
    you.x += dx;
    you.y += dy;
  }
}

// entity update functions //

function updateKey(key) {
  if (isYou(key.x, key.y)) {
    you.hasKey = true;
    keyObj = null;
    entitiesToDelete.push(key);
  }
}

function updateExit(exit) {
  if (isYou(exit.x, exit.y) && you.hasKey) {
    // is this where to make a new level?
    you.hasKey = false;
    level++;
    buildLevel(level);
  }
}

var RANDOM_MOVES = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]];
function updateMoveRandom(entity) {
  var delta = choose(RANDOM_MOVES);
  var width = entityWidth(entity);
  var height = entityHeight(entity);
  if (!isWall(entity.x + delta[0], entity.y + delta[1], width, height)
      && entitiesAt(entity.x + delta[0], entity.y + delta[1], width, height, entity).length === 0) {
    entity.x += delta[0];
    entity.y += delta[1];
  }
  // todo maybe hurt player
  if (isYou(entity.x, entity.y, width, height)) {
    you.health--; // maybe give player its own update function
  }
}

// end entity update functions //

function pressLeft() {
  if (stopped) return;
  tryMovePlayer(-1, 0);
  gameLoop();
}

function pressRight() {
  if (stopped) return;
  tryMovePlayer(1, 0);
  gameLoop();
}

function pressUp() {
  if (stopped) return;
  tryMovePlayer(0, -1);
  gameLoop();
}

function pressDown() {
  if (stopped) return;
  tryMovePlayer(0, 1);
  gameLoop();
}

function pressWait() {
  if (stopped) return;
  // TODO turn into an action button
  gameLoop();
}

document.onkeydown = checkKey;

function checkKey(e) {
  e = e || window.event;

  if (e.keyCode == '38') {
    // up arrow
    pressUp();
  } else if (e.keyCode == '40') {
    // down arrow
    pressDown();
  } else if (e.keyCode == '37') {
    // left arrow
    pressLeft();
  } else if (e.keyCode == '39') {
    // right arrow
    pressRight();
  } else if (e.keyCode == '32') {
    // spacebar
    pressDrop();
  }
}