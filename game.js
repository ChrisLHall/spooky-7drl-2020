var grid = document.querySelector('#grid');
var WIDTH = 29;
var HEIGHT = 26;
var CAM_WIDTH = 15;
var CAM_HEIGHT = 11;
var camX = 0;
var camY = 0;

var level = 1;
var isDarkLevel = true;
var DARK_TILE = "⬛";
var DIM_LIGHT = 2;
var DIM_FLOOR_TILE = "➗";
var DIM_ENTITY = "❔";

var you = {
  gfx: "X",
  x: 5,
  y: 5,
  light: 8,
  health: 5,
  maxHealth: 5,
  dead: false,
  justGotHurt: false,
  hasKey: false,
};
var keyObj = null;
var exitObj = null;

var bg = []; // populated in startGame

var ROOMS = [
  [[1,1,0,1,1,1,1,1,],
   [1,0,0,0,0,0,0,1,],
   [1,0,0,0,0,0,0,0,],
   [0,0,0,0,0,0,0,1,],
   [1,0,0,0,0,0,0,1,],
   [1,1,1,0,1,1,1,1,]]
];

var newRoomsList = [
  [["w","w","d","d","d","w","w"],
   ["w"," "," "," "," "," ","w"],
   ["d"," "," "," "," "," ","d"],
   ["d"," "," "," "," "," ","d"],
   ["w"," "," "," "," "," ","w"],
   ["w","w","d","d","d","w","w"]],
  [["w","d","d","d","w"],
   ["d"," "," "," ","d"],
   ["d"," "," "," ","d"],
   ["w","d","d","d","w"]],
];
// d is maybe door. When they intersect they become D
var ROOM_ELEMENT_DICT = {
  " ": null,
  "w": "☸",
  "d": "☸",
  "D": null, // floor?
};
var ROOM_WALLS = ["☸", "➿"];

var environment = [];
var lightMap = [];
// todo more light sources - for now just use you

var entityTemplate = {
  type: "butts",
  gfx: [["💤"]],
  x: 0,
  y: 0,
  isSolid: false,
};
var entities = [];
var entitiesToDelete = [];
var entityCustomProperties = {
  "key": {
    gfx: [["🗝"]],
  },
  "exit": {
    gfx: [["🚪"]],
  },
  "potion": {
    gfx: [["🧪"]],
    heal: 1,
  },
  "heartContainer": {
    gfx: [["💖"]],
  },
  "rat": {
    gfx: [["🐁"]],
    damage: 1,
    isSolid: true,
  },
  "slime": {
    gfx: [["✳️","✳️"],
          ["✳️","✳️"]],
    damage: 2,
  }
}

// todo moving+placing big entities
var entityUpdateFunctions = {
  "key": updateKey,
  "exit": updateExit,
  "potion": updatePotion,
  "heartContainer": updateHeartContainer,
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

// world generation functions //

function generateRoomGrid(numRooms, options) {
  // TODO
  var roomList = [];
  for (var j = 0; j < numRooms; j++) {
    addRoom(roomList, options);
  }

  return roomListToGrid(roomList, CAM_WIDTH, CAM_HEIGHT);
}

function printRoomGrid(roomGrid) {
  var result = ""
  for (var r = 0; r < roomGrid.length; r++) {
    for (var c = 0; c < roomGrid[r].length; c++) {
      result += roomGrid[r][c];
    }
    result += "\n";
  }
  return result;
}

function roomListToGrid(roomList, minWidth, minHeight) {
  var minX = 0;
  var maxX = 0;
  var minY = 0;
  var maxY = 0;
  for (var j = 0; j < roomList.length; j++) {
    var room = roomList[j];
    minX = Math.min(minX, room.x);
    minY = Math.min(minY, room.y);
    maxX = Math.max(maxX, room.x + room.width);
    maxY = Math.max(maxY, room.y + room.height);
  }
  var width = Math.max(maxX - minX, minWidth);
  var height = Math.max(maxY - minY, minHeight);

  var result = [];
  for (var r = 0; r < height; r++) {
    var row = [];
    for (var c = 0; c < width; c++) {
      row.push(" ");
    }
    result.push(row);
  }

  for (var j = 0; j < roomList.length; j++) {
    var room = roomList[j];
    // offset everything by -minX, -minY
    for (var r = 0; r < room.layout.length; r++) {
      var y = r - minY;
      for (var c = 0; c < room.layout[r].length; c++) {
        var x = c - minX;
        // join the seams between the rooms
        var oldLetter = result[y][x];
        var newLetter = room.layout[r][c];
        if ((oldLetter === "D" || oldLetter === "d") && newLetter === "d") {
          newLetter = "D"; // D is when two edges join to make a door
        }
        result[y][x] = newLetter; // do I want to overwrite space?
      }
    }
  }

  return result;
}

function addRoom(roomList, options) {
  var layout = choose(options);
  var roomListItem = {
    layout: layout,
    x: 0,
    y: 0,
    width: layout[0].length,
    height: layout.length,
  };

  // TODO ACTUALLY PLACE IT SOMEWHERE
  roomList.push(roomListItem);
}


// TODO convert the other stuff to use the new system of rooms

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

function initLightMap(width, height) {
  var result = [];
  for (var r = 0; r < height; r++) {
    var row = [];
    for (var c = 0; c < width; c++) {
      row.push(0);
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
    var startY = k * (roomHeight - 1);
    var endY = (k + 1) * (roomHeight - 1) - 1;
    if (endY >= height) break;
    for (var j = 0; j < width / roomWidth; j++) {
      var startX = j * (roomWidth - 1);
      var endX = (j + 1) * (roomWidth - 1) - 1;
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
      keyObj = createEntity("key", x, y);
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
      exitObj = createEntity("exit", x, y);
      entities.push(exitObj);
      break;
    }
  }
}

function placeEntities(entities, count, type) {
  for (var j = 0; j < count; j++) {
    var monster = createEntity(type, 5, 5);
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
  lightMap = initLightMap(WIDTH, HEIGHT);
  environment = generateWalls(WIDTH, HEIGHT);
  entities = [];
  placeKey(entities, 3, 3, WIDTH - 3, HEIGHT - 3);
  placeExit(entities, 3, 3, WIDTH - 3, HEIGHT - 3, 10);
  placeEntities(entities, Math.min(20, 5 + level), "rat");
  placeEntities(entities, clamp(level - 3, 0, 5), "slime");
  var placePotion = (level % 3) === 0; // TODO 0
  if (placePotion) {
    placeEntities(entities, 1, "potion");
  }
  var placeContainer = (level % 10) === 0; // TODO 0
  if (placeContainer) {
    placeEntities(entities, 1, "heartContainer");
  }
  you.x = 1;
  you.y = 1;
  // todo place YOU
  
  isDarkLevel = level > 2;
}

// end world generation functions //

// ENTRY POINT
function startGame() {
  // TODO WORK THIS INTO BUILD LEVEL
  var grid = generateRoomGrid(3, newRoomsList);
  console.log(printRoomGrid(grid));

  // end todo
  buildLevel(1);

  updateYou();
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

  updateYou();

  renderGrid();
  //setTimeout(gameLoop, FRAME_TIME);
}

function renderGrid() {
  camX = clamp(you.x - Math.floor(CAM_WIDTH / 2), 0, WIDTH - CAM_WIDTH);
  camY = clamp(you.y - Math.floor(CAM_HEIGHT / 2), 0, HEIGHT - CAM_HEIGHT);

  if (isDarkLevel) {
    clearLightMap();
    recursivelyLight(you.x, you.y, you.light); // todo more lights
  }

  var frame = [];
  for (var j = 0; j < CAM_HEIGHT; j++) {
    var frameRow = []
    var y = j + camY;
    for (var k = 0; k < CAM_WIDTH; k++) {
      var x = k + camX;
      var block = null;
      if (!block && isDarkLevel && lightMap[y][x] < 1) {
        block = DARK_TILE;
      }
      if (!block) {
        block = environment[y][x];
      }
      if (!block) {
        block = bg[y][x];
        if (isDarkLevel && lightMap[y][x] <= DIM_LIGHT) {
          block = DIM_FLOOR_TILE;
        }
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
        if (isDarkLevel) {
          var light = lightMap[y + camY][x + camX];
          if (light === 0) {
            frame[y][x] = DARK_TILE;
          } else if (light <= DIM_LIGHT) {
            frame[y][x] = DIM_ENTITY;
          }
        }
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

function clearLightMap() {
  for (var j = 0; j < lightMap.length; j++) {
    var row = lightMap[j];
    for (var k = 0; k < row.length; k++) {
      row[k] = 0;
    }
  }
}

function recursivelyLight(x, y, light) {
  if (light <= 0) return;
  if (x < 0 || y < 0 || x >= lightMap[0].length || y >= lightMap.length) return;
  if (environment[y][x]) {
    light = 1;
  }
  if (lightMap[y][x] < light) {
    lightMap[y][x] = light;
    if (light > 1) {
      recursivelyLight(x - 1, y, light - 1);
      recursivelyLight(x + 1, y, light - 1);
      recursivelyLight(x, y - 1, light - 1);
      recursivelyLight(x, y + 1, light - 1);
    }
  }
}

function createEntity(type, x, y) {
  var result = copyFromTemplate({}, entityTemplate);
  result.type = type;
  copyFromTemplate(result, entityCustomProperties[type]);
  result.x = x;
  result.y = y;
  return result;
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

function entitiesAt(x, y, width, height, self, checkIsSolid) {
  var result = [];
  width = width || 1;
  height = height || 1;
  self = self || null;
  checkIsSolid = checkIsSolid || false;

  for (var j = 0; j < entities.length; j++) {
    var entity = entities[j];
    if (entity === self) continue;
    if (checkIsSolid && !entity.isSolid) continue;
    if (x < entity.x + entityWidth(entity) && entity.x < x + width
        && y < entity.y + entityHeight(entity) && entity.y < y + height) {
      result.push(entity);
    }
  }
  return result;
}

function tryMovePlayer(dx, dy) {
  if (you.dead) return;
  if (!isWall(you.x + dx, you.y + dy)
      && entitiesAt(you.x + dx, you.y + dy, 1, 1, null, true).length === 0) {
    you.x += dx;
    you.y += dy;
  }
}

function affectHealth(delta) {
  you.health = clamp(you.health + delta, 0, you.maxHealth);
  if (you.health === 0 && !you.dead) {
    console.log("you died!");
    you.dead = true;
  }
  if (delta < 0) {
    you.justGotHurt = true;
    // todo more blood?
    bg[you.y][you.x] = "🩸";
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

function updatePotion(potion) {
  if (isYou(potion.x, potion.y, entityWidth(potion), entityHeight(potion))) {
    affectHealth(potion.heal);
    entitiesToDelete.push(potion);
  }
}

function updateHeartContainer(heartContainer) {
  if (isYou(heartContainer.x, heartContainer.y)) {
    you.maxHealth++;
    affectHealth(10);
    entitiesToDelete.push(heartContainer);
  }
}

var RANDOM_MOVES = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]];
function updateMoveRandom(entity) {
  var delta = choose(RANDOM_MOVES);
  var width = entityWidth(entity);
  var height = entityHeight(entity);
  if (isYou(entity.x + delta[0], entity.y + delta[1], width, height)) {
    affectHealth(-(entity.damage || 0));
  } else if (!isWall(entity.x + delta[0], entity.y + delta[1], width, height)
      && entitiesAt(entity.x + delta[0], entity.y + delta[1], width, height, entity).length === 0) {
    entity.x += delta[0];
    entity.y += delta[1];
  }
}

// end entity update functions //

function updateYou() {
  if (you.dead) {
    you.gfx = "☠"
  } else if (you.justGotHurt) {
    you.gfx = "💔";
  } else {
    you.gfx = "🦝";
  }
  you.justGotHurt = false;
}

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
    e.preventDefault();
    // up arrow
    pressUp();
  } else if (e.keyCode == '40') {
    e.preventDefault();
    // down arrow
    pressDown();
  } else if (e.keyCode == '37') {
    e.preventDefault();
    // left arrow
    pressLeft();
  } else if (e.keyCode == '39') {
    e.preventDefault();
    // right arrow
    pressRight();
  } else if (e.keyCode == '32') {
    e.preventDefault();
    // spacebar
    pressWait();
  }
}