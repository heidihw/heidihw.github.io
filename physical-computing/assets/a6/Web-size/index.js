/*
  index.js for Web

  with help from index.js for servo-with-gui by Blair Subbaraman

  2025 November 18
  Heidi Wang
*/

// this should match the baud rate in your Arduino sketch
const BAUD_RATE = 9600;
// these are used for setting up the serial connection
let port, connectBtn;


// storing the last value sent to Arduino
let lastVal = false;
// keeping track of the angle to send to Arduino
let currVal = false;
// reading data back in from Arduino
let sizeRead = 0;

function setup() {
  // Run our serial setup function (below)
  setupSerial();

  // Create a canvas that is the size of our browser window.
  // windowWidth and windowHeight are p5 variables
  createCanvas(windowWidth, windowHeight);

  // p5 text settings. BOLD and CENTER are constants provided by p5.
  // See the "Typography" section in the p5 reference: https://p5js.org/reference/
  textFont("system-ui", 50);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
}


function draw() {
  // read any data coming in from Arduino
  receiveData();
  size = map(sizeRead, 0, 1023, 20, min(windowHeight, windowWidth) -20);

  // draw graphics
  background(109, 0, 198);

  noStroke();
  fill(195, 122, 255);
  rect((windowWidth-size)/2, (windowHeight-size)/2, size, size);

  // process mouse interaction
  if ((windowWidth-size)/2 <= mouseX && mouseX <= (windowWidth+size)/2 &&
    (windowHeight-size)/2 <= mouseY && mouseY <= (windowHeight+size)/2) {
    currVal = true;
  } else {
    currVal = false;
  }

  // display values
  // displayHUD();

  // send data out to the Arduino
  if (lastVal != currVal) {
    console.log('writing', currVal, 'to port');
    port.write(Number(currVal));
    lastVal = currVal;
  }
}

function displayHUD() {
  rect(80, 60, 240, 130);
  fill(109, 0, 198);
  textSize(22);
  text(`Last Value: ${lastVal}`, 200, 100);
  text(`Current Value: ${currVal}`, 200, 150);
}

function receiveData() {
  /**
   * Receive data over serial from your Arduino
   * We're terminating data with a newline character here
   * i.e., we need to Serial.println() in our Arduino code
   */
  // Check whether the port is open (see checkPort function below)
  const portIsOpen = checkPort();
  // If the port is not open, exit the draw loop
  if (!portIsOpen) return;

  // Read from the port until the newline
  let str = port.readUntil("\n");
  // If we didn't read anything, return.
  if (str.length == 0) return;

  // Trim the whitespace (the newline) and convert the string to a number
  sizeRead = Number(str.trim());
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
  connectBtn.position(5, 5);
  // When the button is clicked, run the onConnectButtonClicked function
  connectBtn.mouseClicked(onConnectButtonClicked);
}

function checkPort() {
  if (!port.opened()) {
    // If the port is not open, change button text
    connectBtn.html("Connect to Arduino");
    // Set background to gray
    background("gray");
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
