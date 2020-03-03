var grid = document.querySelector('#grid');
var WIDTH = 11;
var HEIGHT = 18;
var CAM_WIDTH = 9;
var CAM_HEIGHT = 9;
var camX = 0;
var camY = 0;

var FRAME_TIME=700;
var gridArr = [];
var score = 0;
var LINE_POINTS = [40, 100, 300, 1200, 6000];
var scoreText=["",""];
var LINE_TEXTS = [["Single.",""],["Double!",""],["Triple!",""],["BOOM","Tetra!"],["HOLY","SHIT"]];
var lineCounter = 0;
var level = 1;

var piece = {
  arr: [[null,"☀",null],["☀","☀","☀"],["☀","☀","☀"]],
  width: 3,
  height: 3,
  row: 0,
  col: 3,
}

var you = {
  gfx: [["✌"]],
  x: 5,
  y: 5,
};


var bg = []; // populated in startGame

var nextPieceArr = null;

var PIECES_STANDARD = [
  [["✈"]],
  
];
var PIECES_TETRA = [
  [["❄"]],
  
];
var PIECES_BOXING = [
  [["☮","☮"]],
  
];
var PIECES_BONELESS = [
  [["☠",null,"☠"],
   [null,"☠","☠"]],
];

var PIECES = PIECES_STANDARD;

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// copy this transpose because I laid out the pieces wrong above
// oopsies
function copyTranspose(arr) {
  var result = [];
  for (var j = 0; j < arr[0].length; j++) {
    var subResult = [];
    result.push(subResult);
    for (var k = 0; k < arr.length; k++) {
      subResult.push(arr[k][j]);
    }
  }
  return result;
}

var name = "";
function setupPieces() {
  var plainHref = window.location.href;
  var origLoc = window.location.search;
  plainHref = plainHref.substring(0, plainHref.length - origLoc.length);
  var newLoc = "?standard";
  if (origLoc === "?tetra") {
    newLoc = origLoc;
    PIECES = PIECES_TETRA; 
  } else if (origLoc === "?boxing") {
    newLoc = origLoc;
    PIECES = PIECES_BOXING;
  } else if (origLoc === "?boneless") {
    newLoc = origLoc;
    PIECES = PIECES_BONELESS;
  }
  if (origLoc !== newLoc) {
    //window.location.href = plainHref + newLoc;
  }
  if (newLoc !== "?standard") {
    name = newLoc.substring(1,2).toUpperCase() + newLoc.substring(2);
  }
}

function loadNextPiece() {
  nextPieceArr = nextPieceArr || copyTranspose(choose(PIECES));
  piece.arr = nextPieceArr
  piece.height = piece.arr.length;
  piece.width = piece.arr[0].length;
  piece.row = 0;
  piece.col = Math.floor((WIDTH - piece.width) / 2);
  nextPieceArr = copyTranspose(choose(PIECES));
}

var FLOOR_TILES = ["▫", "🔲", "⬛"]; // todo
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



// ENTRY POINT
function startGame() {
  bg = generateBG(WIDTH, HEIGHT);
  for (var j = 0; j < HEIGHT; j++) {
    gridArr.push([]);
    for (var k = 0; k < WIDTH; k++) {
      gridArr[j].push(null);
    }
  }
  setupPieces();
  loadNextPiece();
  //setTimeout(gameLoop, FRAME_TIME);
}

var stopped = false;
function gameLoop() {
  if (!stopped) {
    if (canMovePiece(1, 0)) {
      piece.row++;
    } else {
      commitPiece();
      loadNextPiece();
      if (!canMovePiece(0, 0)) {
        stopped = true;
      }
    }
  }
  if (!stopped) {
    for (var lines = 0; lines < 5; lines++) {
      if (!tryClearLine()) break;
    }
    if (lines > 0) {
      score += LINE_POINTS[lines - 1];
      scoreText = LINE_TEXTS[lines - 1];
      setTimeout(function () { scoreText = ["",""]; }, 1000);
      lineCounter += lines;
      if (lineCounter >= 5) {
        lineCounter -= 5;
        level++;
        FRAME_TIME = Math.floor(FRAME_TIME * .9);
      }
    }
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
        block = maybeRenderPiece(y, x);
      }
      if (!block) {
        block = " ";
        block = bg[y][x];
      }
      str += block;
    }
    str += "<br>";
  }
  grid.innerHTML = twemoji.parse(str);
}

function maybeRenderPiece(row, col) {
  if (row >= piece.row && row < piece.row + piece.height
      && col >= piece.col && col < piece.col + piece.width) {
    return piece.arr[row-piece.row][col-piece.col];
  }
  return null;
}

function renderNextPieceRow(row) {
  var result = "";
  if (row >= nextPieceArr.length) return result;
  var pieceRow = nextPieceArr[row]
  for (var k = 0; k < pieceRow.length; k++) {
    result += pieceRow[k] || "▫";
  }
  return result;
}

function canMovePiece(dRow, dCol, thisPiece) {
  thisPiece = thisPiece || piece;
  if (thisPiece.row + dRow < 0 || thisPiece.row + dRow + thisPiece.height > HEIGHT
      || thisPiece.col + dCol < 0 || thisPiece.col + dCol + thisPiece.width > WIDTH) {
    return false;
  }
  for (var j = 0; j < thisPiece.height; j++) {
    for (var k = 0; k < thisPiece.width; k++) {
      if (thisPiece.arr[j][k] && gridArr[thisPiece.row + j + dRow][thisPiece.col + k + dCol]) {
        return false;
      }
    }
  }
  return true;
}

function commitPiece() {
  for (var j = 0; j < piece.height; j++) {
    for (var k = 0; k < piece.width; k++) {
      if (piece.arr[j][k]) {
        gridArr[piece.row + j][piece.col + k] = piece.arr[j][k];
      }
    }
  }
}

function rotatePiece(forward) {
  var result = { };
  result.width = piece.height;
  result.height = piece.width;
  var newPiece = [];
  for (var k = 0; k < piece.width; k++) {
    newPiece.push([]);
    for (var j = 0; j < piece.height; j++) {
      if (forward) {
        newPiece[k].push(piece.arr[piece.height - 1 - j][k]);
      } else {
        newPiece[k].push(piece.arr[j][piece.width - 1 - k]);
      }
    }
  }
  result.arr = newPiece;
  // don't fully understand why this works
  var halfDiff = Math.floor(Math.abs(piece.width - piece.height) / 2);
  if (piece.width < piece.height) {
    halfDiff *= -1;
  }
  result.row = Math.max(piece.row - halfDiff, 0);
  result.col = Math.min(Math.max(piece.col + halfDiff, 0), WIDTH - result.width);
  return result;
}

function dropPiece() {
  for (var j = 0; j < HEIGHT; j++) {
    if (canMovePiece(1, 0)) {
      piece.row++;
    } else {
      return;
    }
  }
}

function tryClearLine() {
  var line = -1;
  for (var j = HEIGHT - 1; j >= 0; j--) {
    var filled = true;
    for (var k = 0; k < WIDTH; k++) {
      if (!gridArr[j][k]) {
        filled = false;
        break;
      }
    }
    if (filled) {
      line = j;
      break;
    }
  }
  
  if (line === -1) return false;
  for (var j = line; j >= 0; j--) {
    for (var k = 0; k < WIDTH; k++) {
      if (j === 0) {
        gridArr[j][k] = null;
      } else {
        gridArr[j][k] = gridArr[j-1][k];
      }
    }
  }
  return true;
}

function pressLeft() {
  if (stopped) return;
  you.x--;
  if (canMovePiece(0, -1)) {
    piece.col--;
    renderGrid();
  }
  gameLoop();
}

function pressRight() {
  if (stopped) return;
  you.x++;
  if (canMovePiece(0, 1)) {
    piece.col++;
    renderGrid();
  }
  gameLoop();
}

function pressUp() {
  if (stopped) return;
  you.y--;
  var rot = rotatePiece(true);
  if (canMovePiece(0, 0, rot)) {
    piece = rot;
  }
  renderGrid();
  gameLoop();
}

function pressDown() {
  if (stopped) return;
  you.y++;
  if (canMovePiece(1, 0)) {
    piece.row++;
    renderGrid();
  }
  gameLoop();
}

function pressDrop() {
  if (stopped) return;
  dropPiece();
  renderGrid();
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