/**
 * Minesweeper.ino
 *
 * with help from
 * https://www.circuitbasics.com/arduino-ir-remote-receiver-tutorial/
 *
 * The IR receiver sends the value received on each relevant
 * button press, and otherwise a continuous stream to indicate
 * that no button was just pressed.
 * The red indicator light on the receiver blinks when a signal
 * is received.
 *
 * The IR receiver is connected to pin 9,
 * receives power through pin 10,
 * and is connected to ground at pin 11.
 *
 * 2025 December 03
 * Heidi Wang
 */

// IRremote version 2.6.0
#include <IRremote.h>

// IR receiver pin
const int RECV_PIN = 9;
// initialize receiver object
IRrecv irrecv(RECV_PIN);
// initialize results object
decode_results results;
const int powerPin = 10;
const int groundPin = 11;

// setup function
void setup() {
  // begin serial comm
  Serial.begin(9600);
  // enable receiver
  irrecv.enableIRIn();
  // blinks receiver LED when receiving signal
  irrecv.blink13(true);

  // initialize the pin for power as an output
  pinMode(powerPin, OUTPUT);
  // set voltage to HIGH to provide power
  digitalWrite(powerPin, HIGH);
  pinMode(groundPin, OUTPUT);
  digitalWrite(groundPin, LOW);
}

// loop function
void loop() {
  // on receiving input
  if (irrecv.decode(&results)) {
    // print the IR code received
    // Serial.println(results.value, HEX);

    // VOL+
    if (results.value == 0xFF629D) {
      Serial.println(results.value);
    }
    // |<< seek left
    if (results.value == 0xFF22DD) {
      Serial.println(results.value);
    }
    // >|| play/pause
    if (results.value == 0xFF02FD) {
      Serial.println(results.value);
    }
    // >>| seek right
    if (results.value == 0xFFC23D) {
      Serial.println(results.value);
    }
    // v down
    if (results.value == 0xFFE01F) {
      Serial.println(results.value);
    }
    // VOL-
    if (results.value == 0xFFA857) {
      Serial.println(results.value);
    }
    // ^ up
    if (results.value == 0xFF906F) {
      Serial.println(results.value);
    }

    // reset the receiver to receive the next code
    irrecv.resume();
  } else {
    Serial.println(0xFFFFFF);
    delay(50);
  }
}

    // power
    // if (results.value == 0xFFA25D) {
    // 7
    // if (results.value == 0xFF42BD) {
    // 0
    // if (results.value == 0xFF6897) {
    // 8
    // if (results.value == 0xFF4AB5) {
    // EQ
    // if (results.value == 0xFF9867) {
