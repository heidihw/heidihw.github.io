/**
 * minesweeper.js
 *
 * with help from servo-with-gui index.js by Blair Subbaraman
 * 7-segment display bold font from https://www.keshikan.net/fonts-e.html
 *
 * Plays a modified version of minesweeper.
 * - same as normal minesweeper:
 *   - 9x9 board with 10 mines randomly planted (beginner difficulty)
 *   - restart the game at any time
 *   - remaining mines and seconds passed timer display
 *   - smiley for indicating game state
 * - different:
 *   - when you hit a mine, the timer stops as normal,
 *     but you can keep going and solve the rest of the board
 *     - the mouse hold smiley is instead used
 *       to indicate "winning" after already losing
 *
 * Takes inputs from keyboard and Arduino through serial comm
 * Keyboard:
 *   r: restart
 *   e: dig
 *   f: flag
 *   WASD or arrow keys: move
 * Arduino:
 *   7 buttons on infrared remote:
 *           VOL+
 *      |<<  >||  >>|
 *       v   VOL-  ^
 *   corresponding to:
 *            up
 *     left  down  right
 *     dig   flag  restart
 *
 * 2025 December 03
 * Heidi Wang
 */

// this should match the baud rate in your Arduino sketch
const BAUD_RATE = 9600;
// these are used for setting up the serial connection
let port, connectBtn;


// game variables
let n = 9, m = 9;        // [0--(n-1), 0--(m-1)] board size
let mineTotal = 10;

let minePositions;       // {"x,y"}
let uncovered;           // {"x,y": n}
let flagged;             // {"x,y"}
let minesHit;            // {"x,y"}

let currCell;            // [x,y]
let currCellStr;         // for set/map keys
let currImg;             // img object

// translated input from Arduino
let inputAction;

// timing
let startTime, endTime;  // ms
let started, ended;      // T/F state markers to track time

// drawing variables
let imgSize = 50;        // size to draw each cell
let originX, originY;    // top left corner of top left cell

let borderW, borderH, borderX, borderY;
let faceW, faceX, faceY;
let HUDBGW, HUDBGH, flagBGX, HUDBGY, HUDFontSize, flagTextX, HUDTextY;
let                 timeBGX,                      timeTextX;

// colors 0=bg, 1-8, 9= white for edge in light, 10= yellow for face
let mscolors = [
  [192],
  [0,0,255], [0,128,0],   [255,0,0], [0,0,128],
  [128,0,0], [0,128,128], [0],       [128],
  [255],     [255,255,0]
];

// assets
// images for:
let img = [];            // uncovered cells with n adjacent mines
let imgCovered;
// let imgMine;          // mines the player didn't flag are marked after loss
let imgMineHit;          // red bg
let imgFlagged;
// let imgFlaggedWrong;            // non-mines the player flagged are marked after loss
let imgBGBeg, imgBGInt, imgBGExp;  // scaled for each difficulty
let imgBG;                         // the border with the HUD sections
// status faces; mousehold used for "winning" after already losing
let imgFacePlaying, imgFaceWin, imgFaceLose, imgFaceMouseHold;
let HUDFont;                       // 7-segment display bold font


/**
 * loads assets before setup
 * the sketch only begins once preload is finished
 * load_ functions are guaranteed to finish loading or raise an error
 */
function preload() {
  img[0] = loadImage('assets/minesweeper_0.jpg');
  img[1] = loadImage('assets/minesweeper_1.jpg');
  img[2] = loadImage('assets/minesweeper_2.jpg');
  img[3] = loadImage('assets/minesweeper_3.jpg');
  img[4] = loadImage('assets/minesweeper_4.jpg');
  img[5] = loadImage('assets/minesweeper_5.jpg');
  img[6] = loadImage('assets/minesweeper_6.jpg');
  img[7] = loadImage('assets/minesweeper_7.jpg');
  img[8] = loadImage('assets/minesweeper_8.jpg');
  imgCovered = loadImage('assets/minesweeper_9_covered.jpg');
  // imgMine = loadImage('assets/minesweeper_10_mine.jpg');
  imgMineHit = loadImage('assets/minesweeper_11_mine_hit.jpg');
  imgFlagged = loadImage('assets/minesweeper_12_flag.jpg');
  // imgFlaggedWrong = loadImage('assets/minesweeper_13_flag_not.jpg');
  imgBGBeg = loadImage('assets/bg_beg.png');
  imgBGInt = loadImage('assets/bg_int.png');
  imgBGExp = loadImage('assets/bg_exp.png');
  imgFacePlaying = loadImage('assets/face_playing.jpg');
  imgFaceWin = loadImage('assets/face_win.jpg');
  imgFaceLose = loadImage('assets/face_lose.jpg');
  imgFaceMouseHold = loadImage('assets/face_mouse_hold.jpg');
  HUDFont = loadFont('assets/DSEG7Classic-Bold.ttf');
}


/**
 * runs once after preload before draw
 * - sets up the serial connection
 * - creates the canvas and draws the background
 * - calculates the position of the origin
 * - calls setupBoard() to set up the board for a new game
 */
function setup() {
  // Run the serial setup function
  setupSerial();

  // Create the canvas
  createCanvas(windowWidth, windowHeight);

  createPlayButtons();

  createSizingButtons();

  setupBeg();
}

function createPlayButtons() {
  btn = createButton("R");
  if (windowWidth < 800) {
    btn.elt.style.padding = '5px 7px';
    btn.position(250, 40);
  } else {
    btn.position(96, 59);
  }
  btn.mouseClicked(setupBoard);

  btn = createButton("E");
  if (windowWidth < 800) {
    btn.elt.style.padding = '5px 7px';
    btn.position(215, 40);
  } else {
    btn.position(67, 59);
  }
  btn.mouseClicked(dig);

  btn = createButton("F");
  if (windowWidth < 800) {
    btn.elt.style.padding = '5px 7px';
    btn.position(250, 75);
  } else {
    btn.position(96, 84);
  }
  btn.mouseClicked(flag);

  btn = createButton("W");
  if (windowWidth < 800) {
    btn.elt.style.padding = '5px 7px';
    btn.position(180, 40);
  } else {
    btn.position(38, 59);
  }
  btn.mouseClicked(() => {moveCursor('y', -1)});

  btn = createButton("A");
  if (windowWidth < 800) {
    btn.elt.style.padding = '5px 7px';
    btn.position(145, 75);
  } else {
    btn.position(9, 84);
  }
  btn.mouseClicked(() => {moveCursor('x', -1)});

  btn = createButton("S");
  if (windowWidth < 800) {
    btn.elt.style.padding = '5px 7px';
    btn.position(180, 75);
  } else {
    btn.position(38, 84);
  }
  btn.mouseClicked(() => {moveCursor('y', 1)});

  btn = createButton("D");
  if (windowWidth < 800) {
    btn.elt.style.padding = '5px 7px';
    btn.position(215, 75);
  } else {
    btn.position(67, 84);
  }
  btn.mouseClicked(() => {moveCursor('x', 1)});
}

function createSizingButtons() {
  // Beginner
  btn = createButton("Beginner");
  if (windowWidth < 800) {
    btn.elt.style.padding = '5px 7px';
    btn.position(285, 40);
  } else {
    btn.position(9, 159);
  }
  btn.mouseClicked(setupBeg);

  // Intermediate
  btn = createButton("Intermediate");
  if (windowWidth < 800) {
    btn.elt.style.padding = '5px 7px';
    btn.position(285, 75);
  } else {
    btn.position(9, 184);
  }
  btn.mouseClicked(setupInt);

  // Expert
  btn = createButton("Expert");
  if (windowWidth < 800) {
    btn.elt.style.padding = '5px 7px';
    btn.position(285, 110);
  } else {
    btn.position(9, 209);
  }
  btn.mouseClicked(setupExp);

  // Google Play

  // Easy
  btn = createButton("Easy");
  if (windowWidth < 800) {
    btn.elt.style.padding = '5px 7px';
    btn.position(445, 40);
  } else {
    btn.position(9, 259);
  }
  btn.mouseClicked(setupEas);

  // Medium
  btn = createButton("Medium");
  if (windowWidth < 800) {
    btn.elt.style.padding = '5px 7px';
    btn.position(445, 75);
  } else {
    btn.position(9, 284);
  }
  btn.mouseClicked(setupMed);

  // Hard
  btn = createButton("Hard");
  if (windowWidth < 800) {
    btn.elt.style.padding = '5px 7px';
    btn.position(445, 110);
  } else {
    btn.position(9, 309);
  }
  btn.mouseClicked(setupHar);
}

function setupBeg() {
  n = 9, m = 9, mineTotal = 10;  // [0--(n-1), 0--(m-1)] board size

  imgSize = 50*((windowWidth*windowHeight)/(1536*695));  // size to draw each cell

  originX = (windowWidth - imgSize * n) / 2;           // top left corner of top left cell
  originY = (windowHeight - imgSize * m) / 2 + 7 * m;

  imgBG = imgBGBeg;
  borderW = imgSize * n * 1.165;
  borderH = imgSize * m * 1.45;
  borderX = originX - imgSize * 0.72;
  borderY = originY - imgSize * 3.38;

  reCalcHUDPos();

  setupBoard();
}

function setupInt() {
  n = 16, m = 16, mineTotal = 40;  // [0--(n-1), 0--(m-1)] board size

  imgSize = 33*((windowWidth*windowHeight)/(1536*695));  // size to draw each cell

  originX = (windowWidth - imgSize * n) / 2;             // top left corner of top left cell
  originY = (windowHeight - imgSize * m) / 2 + 2.6 * m;

  imgBG = imgBGInt;
  borderW = imgSize * n * 1.095;
  borderH = imgSize * m * 1.254;
  borderX = originX - imgSize * 0.74;
  borderY = originY - imgSize * 3.35;

  reCalcHUDPos();

  setupBoard();
}

function setupExp() {
  n = 30, m = 16, mineTotal = 99;  // [0--(n-1), 0--(m-1)] board size

  imgSize = 33*((windowWidth*windowHeight)/(1536*695));  // size to draw each cell

  originX = (windowWidth - imgSize * n) / 2;             // top left corner of top left cell
  originY = (windowHeight - imgSize * m) / 2 + 2.6 * m;

  imgBG = imgBGExp;
  borderW = imgSize * n * 1.051;
  borderH = imgSize * m * 1.254;
  borderX = originX - imgSize * 0.76;
  borderY = originY - imgSize * 3.35;

  reCalcHUDPos();

  setupBoard();
}

function setupEas() {
  n = 6, m = 13, mineTotal = 10;
}

function setupMed() {
  n = 10, m = 20, mineTotal = 35;
}

function setupHar() {
  n = 13, m = 27, mineTotal = 75;
}

function reCalcHUDPos() {
  faceW = imgSize * 1.496;
  faceX = originX + (imgSize * n - faceW) / 2 + 1;
  faceY = originY - imgSize * 2.43;

  HUDBGW = imgSize * 2.4;
  HUDBGH = imgSize * 1.4;
  flagBGX = originX + imgSize * 0.3;
  HUDBGY = originY - imgSize * 2.4;
  HUDFontSize = imgSize * 0.96;
  flagTextX = originX + imgSize * (0.3 + 2.4 / 2);
  HUDTextY = originY - imgSize * (2.4 - 1.4 / 2);

  timeBGX = originX + imgSize * (n - 0.25 - 2.4);
  timeTextX = originX + imgSize * (n - 0.25 - 2.4 / 2);
}

/**
 * initializes/resets the board for a new game
 * - resets the board to empty
 * - plants new mines
 * - resets the timer variables
 * - resets the HUD and cursor
 */
function setupBoard() {
  // draw background
  background(192);

  stroke('black');
  strokeWeight(1);
  // strokeJoin(MITER);
  fill(192);
  // draw buttons background
  if (windowWidth < 800) {
    drawOuterEdges(0, 0, 602, 151, 4);
  } else {
    drawOuterEdges(0, 0, 174, 342, 4);
  }
  // draw button text
  noStroke();
  fill('black');
  textFont('Arial', 16);
  textAlign(LEFT, BOTTOM);
  if (windowWidth < 800) {
    text("Button Controls", 145, 30);
    text("Minesweeper Options", 285, 30);
    text("Google Play Options", 445, 30);
  } else {
    text("Button Controls", 9, 54);
    text("Minesweeper Options", 9, 154);
    text("Google Play Options", 9, 254);
  }

  // draw board border
  image(imgBG, borderX, borderY, borderW, borderH);
  // drawBorder();

  // draw board cells
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      drawCell([i,j], imgCovered);
      // drawCovered([i, j]);
    }
  }

  minePositions = new Set();  // {"x,y"}
  uncovered = new Map();      // {"x,y": n}
  flagged = new Set();        // {"x,y"}
  minesHit = new Set();       // {"x,y"}

  // plant mines
  while (minePositions.size < mineTotal) {
    let mineX = Math.floor(Math.random() * n);
    let mineY = Math.floor(Math.random() * m);
    if (minePositions.has(mineX + ',' + mineY)) {
      continue;
    }
    minePositions.add(mineX + ',' + mineY);
  }

  startTime = 0, endTime = 0;
  started = false, ended = false;

  // draw HUD
  drawFace(imgFacePlaying);
  drawFlagCt();
  drawTime();

  // starts the cursor in the middle of the board
  currCell = [int(n / 2), int(m / 2)];  // [4,4] for Beg
  currCellStr = currCell[0] + ',' + currCell[1];
  currImg = imgCovered;
  drawCursor();
}


/**
 * loops indefinitely after setup is done
 * takes input from the Arduino
 * calls the corresponding function for each of the 7 inputs
 * - restart: setupBoard()
 * - dig: dig()
 * - flag: flag()
 * - 4 directions: moveCursor() with the corresponding parameters
 * updates the timer
 */
function draw() {
  // read any data coming in from Arduino
  receiveData();

  // process Arduino inputs
  if (inputAction == 82) {  // r
    setupBoard();
  }
  if (inputAction == 69) {  // e
    dig();
  }
  if (inputAction == 70) {  // f
    flag();
  }
  if (inputAction == 87) {  // w
    moveCursor('y', -1);
  }
  if (inputAction == 65) {  // a
    moveCursor('x', -1);
  }
  if (inputAction == 83) {  // s
    moveCursor('y', 1);
  }
  if (inputAction == 68) {  // d
    moveCursor('x', 1);
  }

  // update timer
  if (started && !ended) {
    endTime = millis() - startTime;
    drawTime();
  }
}

/**
 * called on keypress
 * calls the same functions as in draw but for the
 * corresponding keyboard inputs
 */
function keyPressed() {
  if (keyCode === 82) {  // r
    setupBoard();
  }
  if (keyCode === 69) {  // e
    dig();
  }
  if (keyCode === 70) {  // f
    flag();
  }
  if (keyCode === 38 || keyCode === 87) {  // UP_ARROW || w
    moveCursor('y', -1);
  }
  if (keyCode === 37 || keyCode === 65) {  // LEFT_ARROW || a
    moveCursor('x', -1);
  }
  if (keyCode === 40 || keyCode === 83) {  // DOWN_ARROW || s
    moveCursor('y', 1);
  }
  if (keyCode === 39 || keyCode === 68) {  // RIGHT_ARROW || d
    moveCursor('x', 1);
  }
}

/**
 * uncovers the current cell if it is covered and non-flagged
 * - ends the game if a mine was hit
 *   - redraws the current cell and cursor over it
 *   - draws the lose smiley
 *   - stops the timer
 * - calls uncoverBlob() to uncover adjacent cells as needed starting from
 *   the current cell
 *   - redraws the cursor over the current cell
 *   - if the last safe cell has been uncovered,
 *     - draws the win smiley and stops the timer if no mines have been hit
 *     - draws the mousehold smiley otherwise
 * updates the timer for when the game was started if this was the first move
 */
function dig() {
  if (!(uncovered.has(currCellStr) || flagged.has(currCellStr))) {
    if (minePositions.has(currCellStr)) {
      minesHit.add(currCellStr);
      drawCurrCell();
      drawCursor();
      drawFace(imgFaceLose);
      if (!ended) {
        ended = true;
      }
      return;
    } else {
      uncoverBlob([currCell]);
      drawCursor();
      if (uncovered.size == n * m - mineTotal) {
        if (!minesHit.size) {
          drawFace(imgFaceWin);
          ended = true;
        } else {
          drawFace(imgFaceMouseHold);
        }
      }
    }
  }
  if (!started) {
    startTime = millis();
    started = true;
  }
}

/**
 * uncovers all covered, non-flagged cells adjacent to the cells
 * in the cellsToExplore array of cells [x,y]
 * until every cell uncovered has a non-zero number of adjacent mines
 * - calls countAdjacentMines() to
 *   - add new adjacent cells to be uncovered to cellsToExplore
 *   - determine the number of adjacent mines for the correct image to use
 * - redraws each cell with the corresponding image
 * @param {[[int, int]]} cellsToExplore - the cells to uncover
 */
function uncoverBlob(cellsToExplore) {
  while (cellsToExplore.length) {
    let k = cellsToExplore.pop();
    let kStr = k[0] + ',' + k[1];
    let [adjacentCells, n] = countAdjacentMines(k);
    uncovered.set(kStr, img[n]);
    drawCell(k, img[n]);
    if (n == 0) {
      cellsToExplore = cellsToExplore.concat(adjacentCells);
    }
  }
}

/**
 * searches the cells adjacent to cell k for mines
 * returns an array of size 2 containing
 * - all covered non-flagged adjacent cells [x,y] that were searched
 * - the number of mines adjacent to k
 * @param {[int, int]} k - the cell to search around
 * @returns {[[int, int], int]} adjacent cells, the number of adjacent mines
 */
function countAdjacentMines(k) {
  let [x, y] = k;
  let adjacentMines = 0;
  let adjacentCells = [];
  for (let i = x - 1; i <= x + 1; i++) {
    for (let j = y - 1; j <= y + 1; j++) {
      let ijStr = i + ',' + j;
      if (!(i < 0 || j < 0 || i >= n || j >= m ||
        uncovered.has(ijStr) || flagged.has(ijStr))) {
        adjacentCells.push([i, j]);
      }
      if (minePositions.has(ijStr)) {
        adjacentMines++;
      }
    }
  }
  return [adjacentCells, adjacentMines];
}

/**
 * flags or unflags the current cell depending on its state,
 * only if it is covered, and redraws the cursor over it
 * updates the flag counter
 * updates the timer for when the game was started if this was the first move
 */
function flag() {
  if (!uncovered.has(currCellStr)) {
    if (!flagged.has(currCellStr)) {
      flagged.add(currCellStr);
    } else {
      flagged.delete(currCellStr);
    }
    drawFlagCt();
    drawCurrCell();
    drawCursor();
  }
  if (!started) {
    startTime = millis();
    started = true;
  }
}

/**
 * moves the cursor in the given direction
 * - redraws the current cell to cover the cursor
 * - moves the current cell
 * - draws the cursor over the new current cell
 * @param {char in {'x', 'y'}} axis - the axis on which to move
 * @param {int in {-1, 1}} dir - the direction to move on the axis
 */
function moveCursor(axis, dir) {
  drawCurrCell();
  if (axis == 'x' && dir == -1) {
    currCell = [max(0, currCell[0] + dir), currCell[1]];
  }
  if (axis == 'x' && dir == 1) {
    currCell = [min(n - 1, currCell[0] + dir), currCell[1]];
  }
  if (axis == 'y' && dir == -1) {
    currCell = [currCell[0], max(0, currCell[1] + dir)];
  }
  if (axis == 'y' && dir == 1) {
    currCell = [currCell[0], min(m - 1, currCell[1] + dir)];
  }
  currCellStr = currCell[0] + ',' + currCell[1];
  drawCursor();
}

/**
 * draws the given image in the position of the given cell
 * @param {[int, int]} cell - the position of the cell
 * @param {p5.Image} img - the image to draw in the cell
 */
function drawCell(cell, img) {
  image(img, cellX(cell), cellY(cell), imgSize, imgSize);
}

/**
 * updates the image currImg to correspond to the current cell currCell
 */
function updateCurrImg() {
  if (minesHit.has(currCellStr)) {
    currImg = imgMineHit;
  } else if (flagged.has(currCellStr)) {
    currImg = imgFlagged;
  } else if (uncovered.has(currCellStr)) {
    currImg = uncovered.get(currCellStr);
  } else {
    currImg = imgCovered;
  }
}

/**
 * calls updateCurrImg() to update the current image and
 * drawCell(currCell, currImg) to draw the current cell
 */
function drawCurrCell() {
  updateCurrImg();
  drawCell(currCell, currImg);
}

/**
 * draws the cursor, a yellow border around the current cell
 */
function drawCursor() {
  noFill();
  stroke('yellow');
  strokeWeight(4);
  // strokeJoin(MITER);
  square(cellX(currCell) + 2, cellY(currCell) + 2, imgSize - 4);
}

/**
 * calculates the x position, used for drawing the current cell
 * @param {[int, int]} cell - the cell to calculate the x position for
 * @returns {int} the calculated x position
 */
function cellX(cell) {
  return originX + imgSize * cell[0];
}

/**
 * calculates the y position, used for drawing the current cell
 * @param {[int, int]} cell - the cell to calculate the y position for
 * @returns {int} the calculated y position
 */
function cellY(cell) {
  return originY + imgSize * cell[1];
}

/**
 * draws the given smiley in the correct position
 * @param {p5.Image} img - the smiley to draw
 */
function drawFace(img) {
  image(img, faceX, faceY, faceW, faceW);
  // fill('green');
  // noStroke();
  // square(faceX, faceY, faceW);
}

/**
 * draws a background for the flag count and then the count in the HUDFont
 */
function drawFlagCt() {
  // bg
  fill('black');
  // fill('green');
  noStroke();
  rect(flagBGX, HUDBGY, HUDBGW, HUDBGH);
  // value
  fill('red');
  textFont(HUDFont, HUDFontSize);
  textAlign(CENTER, CENTER);
  text(String(max(0, mineTotal - flagged.size)).padStart(3, '0'), flagTextX, HUDTextY);
}

/**
 * draws a background for the timer and then the timer in the HUDFont
 */
function drawTime() {
  // bg
  fill('black');
  // fill('green');
  noStroke();
  rect(timeBGX, HUDBGY, HUDBGW, HUDBGH);
  // value
  fill('red');
  textFont(HUDFont, HUDFontSize);
  textAlign(CENTER, CENTER);
  text(String(min(999, int(endTime/1000))).padStart(3, '0'), timeTextX, HUDTextY);
}

function drawBorder() {
  let d1 = 10;
  drawOuterEdges(borderX, borderY, borderW, borderH, d1);
  drawInnerEdges(originX, originY, imgSize * n, imgSize * m, d1);
  drawInnerEdges(originX, HUDBGY - (flagBGX - originX), imgSize * n, HUDBGH + (flagBGX - originX) * 2, d1);
  let d2 = 4;
  drawInnerEdges(flagBGX, HUDBGY, HUDBGW, HUDBGH, d2);
  drawInnerEdges(timeBGX, HUDBGY, HUDBGW, HUDBGH, d2);
  let d3 = 2;
  drawInnerEdges(faceX, faceY, faceW, faceW, d3);
  let x = faceX, y = faceY, w = faceW, h = faceW, d = d3;
  fill(mscolors[8]);
  quad(x-d, y+h+d, x+w+d, y+h+d, x+w, y+h, x, y+h);  // bottom
  quad(x+w+d, y-d, x+w+d, y+h+d, x+w, y+h, x+w, y);  // right
}

function drawCovered(cell) {
  drawOuterEdges(cellX(cell), cellY(cell), imgSize, imgSize, 6);
}

function drawUnflag(cell) {
  fill(mscolors[0]);
  noStroke();
  let x = cellX(cell), y = cellY(cell), w = imgSize, h = imgSize, d = 6;
  quad(x+d, y+d, x+w-d, y+d, x+w-d, y+h-d, x+d, y+h-d);
}

function drawOuterEdges(x, y, w, h, d) {
  noStroke();

  fill(mscolors[9]);
  // fill('green');
  quad(x, y, x+w, y, x+w-d, y+d, x+d, y+d);  // top
  quad(x, y, x, y+h, x+d, y+h-d, x+d, y+d);  // left

  fill(mscolors[8]);
  // fill('green');
  quad(x, y+h, x+w, y+h, x+w-d, y+h-d, x+d, y+h-d);  // bottom
  quad(x+w, y, x+w, y+h, x+w-d, y+h-d, x+w-d, y+d);  // right
}

function drawInnerEdges(x, y, w, h, d) {
  noStroke();

  fill(mscolors[8]);
  // fill('green');
  quad(x-d, y-d, x+w+d, y-d, x+w, y, x, y);  // top
  quad(x-d, y-d, x-d, y+h+d, x, y+h, x, y);  // left

  fill(mscolors[9]);
  // fill('green');
  quad(x-d, y+h+d, x+w+d, y+h+d, x+w, y+h, x, y+h);  // bottom
  quad(x+w+d, y-d, x+w+d, y+h+d, x+w, y+h, x+w, y);  // right
}

function drawInterior(x, y, w, h, d) {
}

/**
 * Receive data over serial from your Arduino
 * We're terminating data with a newline character here
 * i.e., we need to Serial.println() in our Arduino code
 *
 * then maps the input reading to a corresponding string inputAction
 * to be used in draw
 */
function receiveData() {
  // Check whether the port is open (see checkPort function below)
  const portIsOpen = checkPort();
  // If the port is not open, stop drawing for this run of the loop
  if (!portIsOpen) return;

  // Read from the port until the newline
  let str = port.readUntil("\n");
  // If we didn't read anything, stop drawing for this run of the loop
  if (str.length == 0) return;

  // Trim the whitespace (the newline) and convert the string to a number.
  let inputRead = Number(str.trim());
  // Translate the reading into the keycode for the corresponding input.
  let actions = new Map();
  actions.set(0xFF629D, 82);
  actions.set(0xFF22DD, 69);
  actions.set(0xFF02FD, 70);
  actions.set(0xFFC23D, 87);
  actions.set(0xFFE01F, 65);
  actions.set(0xFFA857, 83);
  actions.set(0xFF906F, 68);
  actions.set(0xFFFFFF, undefined);
  inputAction = actions.get(inputRead);
}

// Three helper functions for managing the serial connection.

function setupSerial() {
  port = createSerial();

  // Check to see if there are any ports we have used previously
  let usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) {
    // If there are ports we've used, open the first one
    port.open(usedPorts[0], BAUD_RATE);
  }

  // Create a connect button
  connectBtn = createButton("Connect to Arduino");
  // Position the button in the top left of the screen.
  if (windowWidth < 800) {
    connectBtn.elt.style.padding = '5px 7px';
  }
  connectBtn.position(9, 9);
  // When the button is clicked, run the onConnectButtonClicked function
  connectBtn.mouseClicked(onConnectButtonClicked);
}

function checkPort() {
  if (!port.opened()) {
    // If the port is not open, change button text
    connectBtn.html("Connect to Arduino");
    // Set background to gray
    // background("gray");
    return false;
  } else {
    // Otherwise we are connected
    connectBtn.html("Disconnect");
    return true;
  }
}

function onConnectButtonClicked() {
  // When the connect button is clicked
  if (!port.opened()) {
    // If the port is not opened, we open it
    port.open(BAUD_RATE);
  } else {
    // Otherwise, we close it!
    port.close();
  }
}
