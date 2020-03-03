var grid = document.querySelector('#grid');
var WIDTH = 20;
var HEIGHT = 20;
var CAM_WIDTH = 15;
var CAM_HEIGHT = 11;
var camX = 0;
var camY = 0;

var you = {
  gfx: [["✌"]],
  x: 5,
  y: 5,
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

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// shallow copy
function copyFromTemplate(obj, template) {
  Object.assign(obj, template); // test??
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

// ENTRY POINT
function startGame() {
  bg = generateBG(WIDTH, HEIGHT);
  environment = generateWalls(WIDTH, HEIGHT);
}

var stopped = false;
function gameLoop() {
  if (!stopped) {
  }
  
  renderGrid();
  //setTimeout(gameLoop, FRAME_TIME);
}

function renderGrid() {
  camX = clamp(you.x - Math.floor(CAM_WIDTH / 2), 0, WIDTH - CAM_WIDTH);
  camY = clamp(you.y - Math.floor(CAM_HEIGHT / 2), 0, HEIGHT - CAM_HEIGHT);
  var str = "";
  for (var j = 0; j < CAM_HEIGHT; j++) {
    var y = j + camY;
    for (var k = 0; k < CAM_WIDTH; k++) {
      var x = k + camX;
      var block = null;
      if (y === you.y && x === you.x) {
        block = you.gfx;
      }
      if (!block) {
        block = environment[y][x];
      }
      if (!block) {
        block = bg[y][x];
      }
      str += block;
    }
    str += "<br>";
  }
  grid.innerHTML = twemoji.parse(str);
}

function pressLeft() {
  if (stopped) return;
  you.x--;
  gameLoop();
}

function pressRight() {
  if (stopped) return;
  you.x++;
  gameLoop();
}

function pressUp() {
  if (stopped) return;
  you.y--;
  gameLoop();
}

function pressDown() {
  if (stopped) return;
  you.y++;
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