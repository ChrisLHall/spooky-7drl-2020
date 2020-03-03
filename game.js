var grid = document.querySelector('#grid');
var WIDTH = 20;
var HEIGHT = 20;
var CAM_WIDTH = 15;
var CAM_HEIGHT = 11;
var camX = 0;
var camY = 0;

var you = {
  gfx: "✌",
  x: 5,
  y: 5,
  hasKey: false,
};

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

var entityUpdateFunctions = {
  "key": updateKey,
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
  for (var j = 0; j < 100; j++) {
    // try to place 10 times
    var x = randomInt(xMin, xMax);
    var y = randomInt(yMin, yMax);
    if (isEmpty(x, y)) {
      keyObj = copyFromTemplate({}, entityTemplate);
      keyObj.type = "key";
      keyObj.gfx = [["🗝"]];
      keyObj.x = x;
      keyObj.y = y;

      entities.push(keyObj);
      break;
    }
  }
}

// ENTRY POINT
function startGame() {
  bg = generateBG(WIDTH, HEIGHT);
  environment = generateWalls(WIDTH, HEIGHT);
  entities = [];
  placeKey(entities, 2, 2, WIDTH - 2, HEIGHT - 2);

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

  // TODO draw YOU and entities
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
  str += "💙💙💙💙💙" + "&nbsp;&nbsp;&nbsp;" + (you.hasKey ? "🗝" : "&nbsp;") + "<br>";
  grid.innerHTML = twemoji.parse(str);
}

function isEmpty(x, y) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return false;
  if (you.x === x && you.y === y) return false;
  if (environment[y][x]) return false;
  return true;
}

function tryMovePlayer(dx, dy) {
  if (isEmpty(you.x + dx, you.y + dy)) {
    you.x += dx;
    you.y += dy;
  }
}

// entity update functions //

function updateKey(key) {
  if (key.x === you.x && key.y === you.y) {
    you.hasKey = true;
    entitiesToDelete.push(key);
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

function pressDrop() {
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