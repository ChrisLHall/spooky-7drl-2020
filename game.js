var grid = document.querySelector('#grid');
var levelWidth = 15;
var levelHeight = 11;
var CAM_WIDTH = 15;
var CAM_HEIGHT = 11;
var camX = 0;
var camY = 0;

var level = 1;
var isDarkLevel = true;
var DARK_TILE = "⬛";
var DIM_LIGHT = 4;
var DIM_FLOOR_TILE = "➗";
var DIM_ENTITY = "❔";

var you = {
  gfx: "X",
  x: 5,
  y: 5,
  light: 11,
  health: 5,
  maxHealth: 5,
  dead: false,
  justGotHurt: false,
  hasKey: false,
  collected: 0,
};
var keyObj = null;
var exitObj = null;

var bg = []; // populated in startGame

var ROOMS = [
  [["w","w","d","d","d","w","w"],
   ["w"," "," "," "," "," ","w"],
   ["d"," "," "," "," "," ","d"],
   ["d"," "," "," "," "," ","d"],
   ["d"," "," "," "," "," ","w"],
   ["w","w","d","d","d","d","w"]],
  [["w","d","d","d","d","w"],
   ["d"," "," "," "," ","d"],
   ["d"," "," "," "," ","d"],
   ["d"," "," "," "," ","d"],
   ["w","d","d","d","d","w"]],
  [["w","w","d","d","d","d","w","w","w"],
   ["w"," "," "," "," "," "," "," ","w"],
   ["d"," "," "," "," "," "," "," ","d"],
   ["d"," "," "," "," "," "," "," ","d"],
   ["d"," "," "," "," "," "," "," ","d"],
   ["d"," "," "," "," "," "," "," ","w"],
   ["w","w","w","d","d","d","d","d","w"]],
  [["w","w","w","w","d","d","d","w","w","w"],
   ["d"," "," "," "," "," "," "," "," ","d"],
   ["d"," "," "," "," "," "," "," "," ","d"],
   ["w","w","w","d","d","d","d","d","w","w"]],
  [["w","d","d","d","w"],
   ["w"," "," "," ","w"],
   ["d"," "," "," ","d"],
   ["d"," "," "," ","d"],
   ["d"," "," "," ","d"],
   ["d"," "," "," ","d"],
   ["w"," "," "," ","w"],
   ["w","d","d","d","w"]],
  [["w","d","d","d","d","d","w"],
   ["w"," "," "," "," "," ","w"],
   ["d"," "," "," "," "," ","d"],
   ["d"," ","w","w","w"," ","d"],
   ["d"," "," "," "," "," ","d"],
   ["w"," "," "," "," "," ","w"],
   ["w","d","d","d","d","d","w"]],
  [["w","d","d","d","d","w"],
   ["d"," "," "," "," ","d"],
   ["w","w"," "," "," ","d"],
   ["d"," "," ","w","w","w"],
   ["d"," "," "," "," ","d"],
   ["w","d","d","d","d","w"]],
  [["w","w","d","d","d","d","w","w","w"],
   ["w"," "," "," "," "," "," "," ","w"],
   ["d"," ","w","w"," "," "," "," ","d"],
   ["d"," ","w","w"," "," "," ","w","w"],
   ["d"," "," "," "," "," "," "," ","d"],
   ["d"," "," "," ","w"," "," "," ","d"],
   ["d"," "," "," "," "," "," "," ","w"],
   ["w","w","w","d","d","d","d","d","w"]],
   [["w","d","d","d","d","d","d","d","w"],
    ["d"," "," "," "," "," "," "," ","d"],
    ["d"," "," "," "," "," "," "," ","d"],
    ["d"," "," "," "," "," "," "," ","d"],
    ["d"," "," "," "," "," "," "," ","d"],
    ["d"," "," "," "," "," "," "," ","d"],
    ["d"," "," "," "," "," "," "," ","d"],
    ["d"," "," "," "," "," "," "," ","d"],
    ["d"," "," "," "," "," "," "," ","d"],
    ["w","d","d","d","d","d","d","d","w"]],
];
// d is maybe door. When they intersect they become D
var ROOM_ELEMENT_DICT = {
  " ": null,
  "w": "➿",
  "d": "➿",
  ".": "💠",
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
  "collect": {
    gfx: [["📒"]],
  },
  "potion": {
    gfx: [["🧪"]],
    heal: 1,
  },
  "heart container": {
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
    damage: 1,
  },
  "dire rat": {
    gfx: [["🐀"]],
    damage: 1,
    isSolid: true,
  },
  "ghost": {
    gfx: [["👻"]],
    damage: 2,
  },
  "wall breaker": {
    gfx: [["🗿","🗿"],
          ["🗿","🗿"]],
    damage: 2,
    isSolid: true,
  },
  "spider": {
    gfx: [["🕷"]],
    damage: 1,
    isSolid: true,
  },
  "spider web": {
    gfx: [["🕸"]],
    isSolid: true,
  },
}

var entityUpdateFunctions = {
  "key": updateKey,
  "exit": updateExit,
  "collect": updateCollect,
  "potion": updatePotion,
  "heart container": updateHeartContainer,
  "rat": updateMoveRandom,
  "slime": updateSlime,
  "dire rat": updateChaseAtCloseRange,
  "ghost": timerUpdateFunction(updateGhostMoveTowardsYou, 3),
  "spider": updateSpider,
  "wall breaker": updateWallBreaker,
};

var entityCountFunctions = {
  "collect": function(level) {
    return 1;
  },
  "potion": function(level) {
    return (level > 3 && (level % 3) === 1) ? 1 : 0;
  },
  "heart container": function(level) {
    return ((level % 10) === 0) ? 1 : 0;
  },
  "rat": function(level) {
    return 2 + Math.floor(level / 3);
  },
  "slime": function(level) {
    return (level % 4 === 2) ? Math.floor(level / 5) : 0;
  },
  "dire rat": function(level) {
    return Math.floor(level / 5);
  },
  "ghost": function(level) {
    if (level < 7) return 0;
    return (Math.random() < 0.3) ? Math.ceil((level - 6) / 5) : 0;
  },
  "spider": function(level) {
    return (level > 8 && level % 2 === 1) ? Math.floor((level - 8) / 2) : 0;
  },
  "wall breaker": function(level) {
    var result = 0;
    for (var j = 0; j < Math.floor(level / 12); j++) {
      result += Math.random() < .5 ? 1 : 0;
    }
    return result;
  },
}

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
      row.push("."); // . is background i.e. out of bounds
    }
    result.push(row);
  }

  for (var j = 0; j < roomList.length; j++) {
    var room = roomList[j];
    // offset everything by -minX, -minY
    for (var r = 0; r < room.layout.length; r++) {
      var y = r - minY + room.y;
      for (var c = 0; c < room.layout[r].length; c++) {
        var x = c - minX + room.x;
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
  var newRoom = {
    layout: layout,
    x: 0,
    y: 0,
    width: layout[0].length,
    height: layout.length,
  };

  var foundAPlace = false;
  // place along the edge of a random room? overlap 1 tile
  if (roomList.length > 0) {
    // up to 20 attempts to place
    for (var attempt = 0; attempt < 20; attempt++) {
      var otherRoom = choose(roomList);
      pickRandomPosForRoom(newRoom, otherRoom);
      if (doRoomsConnect(newRoom, otherRoom) && !doAnyRoomsIntersect(newRoom, roomList)) {
        foundAPlace = true;
        break;
      }
    }
  } else {
    foundAPlace = true; // place at 0, 0
  }

  if (foundAPlace) {
    roomList.push(newRoom);
  }
}

function pickRandomPosForRoom(newRoom, otherRoom) {
  var minX = otherRoom.x - newRoom.width + 1;
  var maxX = otherRoom.x + otherRoom.width - 1;
  var randomX = randomInt(minX + 2, maxX - 2);
  var minY = otherRoom.y - newRoom.height + 1;
  var maxY = otherRoom.y + otherRoom.height - 1;
  var randomY = randomInt(minY + 2, maxY - 2);

  var rand = Math.random();
  if (rand < .25) {
    // left
    newRoom.x = minX;
    newRoom.y = randomY;
  } else if (rand < .5) {
    // right
    newRoom.x = maxX;
    newRoom.y = randomY;
  } else if (rand < .75) {
    // up
    newRoom.x = randomX;
    newRoom.y = minY;
  } else {
    // down
    newRoom.x = randomX;
    newRoom.y = maxY;
  }
}

function doAnyRoomsIntersect(newRoom, roomList) {
  for (var j = 0; j < roomList.length; j++) {
    if (doRoomsIntersect(newRoom, roomList[j])) {
      return true;
    }
  }
  return false;
}

// check if the inner bits of the room intersect
function doRoomsIntersect(room1, room2) {
  return (room1.x + 1) <= (room2.x + room2.width - 1)
      && (room2.x + 1) <= (room1.x + room1.width - 1)
      && (room1.y + 1) <= (room2.y + room2.height - 1)
      && (room2.y + 1) <= (room1.y + room1.height - 1);
}

function doRoomsConnect(room1, room2) {
  // get the area of intersection
  var minX = Math.max(room1.x, room2.x);
  var maxX = Math.min(room1.x + room1.width, room2.x + room2.width);
  var minY = Math.max(room1.y, room2.y);
  var maxY = Math.min(room1.y + room1.height, room2.y + room2.height);
  for (var y = minY; y < maxY; y++) {
    for (var x = minX; x < maxX; x++) {
      if (room1.layout[y - room1.y][x - room1.x] === "d"
          && room2.layout[y - room2.y][x - room2.x] === "d") {
        return true;
      }
    }
  }
  return false;
}

function roomGridToWalls(roomGrid, outSpawnPositions) {
  var result = [];
  for (var y = 0; y < roomGrid.length; y++) {
    var resultRow = [];
    for (var x = 0; x < roomGrid[y].length; x++) {
      var tile = roomGrid[y][x];
      resultRow.push(ROOM_ELEMENT_DICT[tile]);
      if (tile === " ") {
        outSpawnPositions.push([x, y]);
      }
    }
    result.push(resultRow);
  }
  return result;
}

var FLOOR_TILES = ["▫"];
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

function placeYou(spawnPoints) {
  var point = choose(spawnPoints);
  you.x = point[0];
  you.y = point[1];
}

function placeEntities(entities, spawnPoints, count, type, avoidPoints, avoidDistance) {
  avoidPoints = avoidPoints || [];
  avoidDistance = avoidDistance || 5;
  for (var j = 0; j < count; j++) {
    placeEntity(entities, spawnPoints, type, avoidPoints, avoidDistance);
  }
}

function placeEntity(entities, spawnPoints, type, avoidPoints, avoidDistance) {
  avoidPoints = avoidPoints || [];
  avoidDistance = avoidDistance || 5;
  var monster = createEntity(type, 5, 5);
  var width = entityWidth(monster);
  var height = entityHeight(monster);
  for (var attempt = 0; attempt < 1000; attempt++) {
    // try to place 10 times
    var point = choose(spawnPoints);
    var x = point[0];
    var y = point[1];
    var tooClose = false;
    for (var avoid = 0; avoid < avoidPoints.length; avoid++) {
      var avoidPoint = avoidPoints[avoid];
      var dist = Math.abs(x - avoidPoint[0]) + Math.abs(y - avoidPoint[1]);
      if (dist < avoidDistance) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;
    if (!isYou(x, y, width, height) && !isWall(x, y, width, height) && entitiesAt(x, y, width, height).length === 0) {
      monster.x = x;
      monster.y = y;
      break;
    }
  }
  entities.push(monster);
  return monster;
}

function buildLevel(level) {
  var grid = generateRoomGrid(5 + Math.floor(level / 3), ROOMS);
  //console.log(printRoomGrid(grid));
  levelWidth = grid[0].length;
  levelHeight = grid.length;
  
  var spawnPoints = [];
  environment = roomGridToWalls(grid, spawnPoints);

  bg = generateBG(levelWidth, levelHeight);
  lightMap = initLightMap(levelWidth, levelHeight);
  
  entities = [];
  placeYou(spawnPoints);
  var avoid = [[you.x, you.y]];
  var key = placeEntity(entities, spawnPoints, "key", avoid, 10);
  avoid.push([key.x, key.y]);
  placeEntity(entities, spawnPoints, "exit", avoid, 10);

  var monsters = Object.keys(entityCountFunctions);
  avoid = [[you.x, you.y]];
  for (var j = 0; j < monsters.length; j++) {
    var monster = monsters[j];
    placeEntities(entities, spawnPoints, entityCountFunctions[monster](level), monster, avoid, 5);
  }
  
  isDarkLevel = level > 2;
}

// end world generation functions //

// ENTRY POINT
function startGame() {
  buildLevel(1);

  updateYou();
  renderGrid();
}

var stopped = false;
function gameLoop() {
  if (!stopped) {
  }

  // update
  for (var j = 0; j < entities.length; j++) {
    var entity = entities[j];
    if (entity.type in entityUpdateFunctions) {
      entityUpdateFunctions[entity.type](entity);
    }
  }
  updateYou();

  // now delete
  for (var j = 0; j < entitiesToDelete.length; j++) {
    var entity = entitiesToDelete[j];
    var index = entities.indexOf(entity);
    if (-1 !== index) {
      entities.splice(index, 1);
    }
  }
  entitiesToDelete = [];

  renderGrid();
}

function renderGrid() {
  camX = clamp(you.x - Math.floor(CAM_WIDTH / 2), 0, levelWidth - CAM_WIDTH);
  camY = clamp(you.y - Math.floor(CAM_HEIGHT / 2), 0, levelHeight - CAM_HEIGHT);

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
  
  var healthStr = "";
  for (var j = 0; j < you.maxHealth; j++) {
    healthStr += you.health > j ? "💙" : "🖤";
  }
  str += "Level " + level + "&nbsp;&nbsp;" + healthStr + "&nbsp;&nbsp;" + (you.hasKey ? "🗝" : "&nbsp;");
  if (you.collected > 0) {
    str += "&nbsp;&nbsp;" + entityCustomProperties["collect"].gfx[0][0] + you.collected;
  }
  str += "<br>";
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

function isBorder(x, y, width, height) {
  width = width || 1;
  height = height || 1;
  return (x < 0 || y < 0 || x + width > levelWidth || y + height > levelHeight);
}

function isWall(x, y, width, height) {
  width = width || 1;
  height = height || 1;
  if (isBorder(x, y, width, height)) return true;

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
  if (you.dead) return false;
  var entitiesInTheWay = entitiesAt(you.x + dx, you.y + dy, 1, 1, null, true);
  if (!isWall(you.x + dx, you.y + dy)
      && entitiesInTheWay.length === 0) {
    you.x += dx;
    you.y += dy;
    return true;
  }
  // SPECIAL CASE FOR CLEARING SPIDER WEBS
  for (var j = 0; j < entitiesInTheWay.length; j++) {
    var entity = entitiesInTheWay[j];
    if (entity.type === "spider web") {
      entitiesToDelete.push(entity);
    }
  }
  return false;
}

function affectHealth(delta) {
  you.health = clamp(you.health + delta, 0, you.maxHealth);
  if (you.health === 0 && !you.dead) {
    console.log("you died!");
    you.dead = true;
  }
  if (delta < 0) {
    you.justGotHurt = true;
    bg[you.y][you.x] = "🩸";
  }
}

function tryMoveEntity(entity, dx, dy, dealDamage) {
  var width = entityWidth(entity);
  var height = entityHeight(entity);
  if (isYou(entity.x + dx, entity.y + dy, width, height)) {
    if (dealDamage) {
      affectHealth(-(entity.damage || 0));
    }
    return false;
  } else if (!isWall(entity.x + dx, entity.y + dy, width, height)
      && entitiesAt(entity.x + dx, entity.y + dy, width, height, entity).length === 0) {
    entity.x += dx;
    entity.y += dy;
    return true;
  }
  return false;
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

function updateCollect(collect) {
  if (isYou(collect.x, collect.y)) {
    you.collected++;
    entitiesToDelete.push(collect);
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

function updateMoveRandomOrIdle(entity) {
  if (Math.random() < .2) return;
  updateMoveRandom(entity);
}

var RANDOM_MOVES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function updateMoveRandom(entity) {
  var delta = choose(RANDOM_MOVES);
  tryMoveEntity(entity, delta[0], delta[1], true);
}

function updateSlime(entity) {
  entity.damage = Math.random() < .5 ? 1 : 0;
  updateMoveRandom(entity);
}

var CLOSE_DIST = 6;
function updateChaseAtCloseRange(entity) {
  if (Math.random() < .4) return;
  var entityDist = Math.abs(entity.x - you.x) + Math.abs(entity.y - you.y);
  if (entityDist <= CLOSE_DIST) {
    updateMoveTowardsYou(entity);
  } else {
    updateMoveRandom(entity);
  }
}

function updateMoveTowardsYou(entity) {
  var delta = [you.x - entity.x, you.y - entity.y];
  if (delta[0] === 0 && delta[1] === 0) {
    tryMoveEntity(entity, 0, 0, true);
    return;
  }
  var chanceMoveX = Math.abs(delta[0]) / (Math.abs(delta[0]) + Math.abs(delta[1]));
  if (Math.random() < chanceMoveX) {
    var dx = clamp(delta[0], -1, 1);
    tryMoveEntity(entity, dx, 0, true);
  } else {
    var dy = clamp(delta[1], -1, 1);
    tryMoveEntity(entity, 0, dy, true);
  }
}

function timerUpdateFunction(updateFunc, time) {
  var counter = 0;
  var result = function(entity) {
    counter++;
    if (counter >= time) {
      counter = 0;
      updateFunc(entity);
    }
  }
  return result;
}

function updateGhostMoveTowardsYou(entity) {
  var delta = [you.x - entity.x, you.y - entity.y];
  if (delta[0] === 0 && delta[1] === 0) {
    // try hurt player
    tryMoveEntity(entity, 0, 0, true);
  } else {
    var chanceMoveX = Math.abs(delta[0]) / (Math.abs(delta[0]) + Math.abs(delta[1]));
    if (Math.random() < chanceMoveX) {
      delta[0] = clamp(delta[0], -1, 1);
      delta[1] = 0;
    } else {
      delta[0] = 0;
      delta[1] = clamp(delta[1], -1, 1);
    }
    entity.x += delta[0];
    entity.y += delta[1];
    // try hurt player
    tryMoveEntity(entity, 0, 0, true);
  }
}

function updateSpider(entity) {
  var origX = entity.x;
  var origY = entity.y;
  // assume width and height 1
  if (Math.random() < .6) {
    var delta = choose(RANDOM_MOVES);
    var moved = tryMoveEntity(entity, delta[0], delta[1], true);
    if (moved && Math.random() < .6) {
      var newDelta = choose(RANDOM_MOVES);
      // don't just move backwards
      if (newDelta[0] !== -delta[0] || newDelta[1] !== -delta[1]) {
        tryMoveEntity(entity, newDelta[0], newDelta[1], true);
      }
    }
  }
  if (Math.random() < .1 && entitiesAt(origX, origY, 1, 1).length === 0) {
    var web = createEntity("spider web", origX, origY);
    entities.push(web);
  }
}

var WALL_BREAKER_COOLDOWN = 12;
function updateWallBreaker(entity) {
  entity.mad = entity.mad || false;
  entity.madCooldown = entity.madCooldown || 0;
  entity.dirX = entity.dirX || 0;
  entity.dirY = entity.dirY || 0;
  entity.gfx = entity.mad
    ? [["😡","😡"],
       ["😡","😡"]]
    : [["🗿","🗿"],
       ["🗿","🗿"]];
  
  var width = entityWidth(entity);
  var height = entityHeight(entity);
  if (entity.mad) {
    // cruise in a direction, pushing entities maybe, until I hit a wall
    // then break those walls
    if (isBorder(entity.x + entity.dirX, entity.y + entity.dirY, width, height)) {
      entity.mad = false;
      return;
    }
    if (isYou(entity.x + entity.dirX, entity.y + entity.dirY, width, height)) {
      affectHealth(-(entity.damage || 0));
      entity.mad = false;
      return;
    }
    var entitiesInTheWay = entitiesAt(entity.x + entity.dirX, entity.y + entity.dirY, width, height, entity);
    var blocked = false;
    for (var j  = 0; j < entitiesInTheWay.length; j++) {
      var other = entitiesInTheWay[j];
      if (!tryMoveEntity(other, entity.dirX, entity.dirY, true)) {
        blocked = true;
      }
    }
    if (blocked) {
      entity.mad = false;
      return;
    }
    // if there are no entities in the way, lets break some walls
    entity.x += entity.dirX;
    entity.y += entity.dirY;
    var hitWall = false;
    for (var y = entity.y; y < entity.y + height; y++) {
      for (var x = entity.x; x < entity.x + width; x++) {
        if (environment[y][x]) {
          environment[y][x] = null;
          bg[y][x] = "◽";
          hitWall = true;
        }
      }
    }
    if (hitWall) {
      entity.mad = false;
    }
  } else {
    entity.madCooldown--;
    // not on top of you, but you are nearby
    if (entity.madCooldown <= 0 && !isYou(entity.x, entity.y, width, height)
        && isYou(entity.x - 3, entity.y - 3, width + 6, height + 6)) {
      // get mad
      entity.mad = true;
      entity.madCooldown = WALL_BREAKER_COOLDOWN;
      // move towards player. Guaranteed not to be on top of player
      var delta = [you.x - entity.x, you.y - entity.y];
      var chanceMoveX = Math.abs(delta[0]) / (Math.abs(delta[0]) + Math.abs(delta[1]));
      if (Math.random() < chanceMoveX) {
        entity.dirX = clamp(delta[0], -1, 1);
        entity.dirY = 0;
      } else {
        entity.dirX = 0;
        entity.dirY = clamp(delta[1], -1, 1);
      }
    } else {
      // rarely wander
      if (Math.random() < .8) return;
      updateMoveRandom(entity);
    }
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