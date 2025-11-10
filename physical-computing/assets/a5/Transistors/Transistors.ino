/*
  Transistors

  with help from
  https://www.circuitbasics.com/arduino-ir-remote-receiver-tutorial/

  The load on the transistor is gradually activated or deavtivated
  whenever the power button on the IR remote is pressed.

  The transistor is connected to pin 10.
  The IR receiver is connected to pin 7.

  2025 November 10
  Heidi Wang
*/

// IRremote version 2.6.0
#include <IRremote.h>

// IR receiver pin
const int RECV_PIN = 7;
// initialize receiver object
IRrecv irrecv(RECV_PIN);
// initialize results object
decode_results results;
// transistor load pin
const int loadPin = 10;
// the current state of the load pin
int loadState = LOW;

// setup function
void setup() {
  // begin serial comm
  Serial.begin(9600);
  // enable receiver
  irrecv.enableIRIn();
  // blinks receiver LED when receiving signal
  irrecv.blink13(true);
  // sets load pin as OUTPUT
  pinMode(loadPin, OUTPUT);
  // turn off load for initial state
  digitalWrite(loadPin, LOW);
}

// loop function
void loop() {
    // on receiving input
    if (irrecv.decode(&results)) {
        // print the IR code received
        Serial.println(results.value, HEX);

        //if keypad power button is pressed
        if (results.value == 0xFFA25D) {
          // toggle the load state
          loadState = !loadState;

          // if the new load state is HIGH, then gradually activate the load
          if (loadState == HIGH) {
            // fade in from min to max in increments of 5 points:
            for (int fadeValue = 0; fadeValue <= 255; fadeValue += 5) {
              // sets the value for the load (range from 0 to 255):
              analogWrite(loadPin, fadeValue);
              // wait for 30 milliseconds to see the fading effect
              delay(30);
            }
          }
          // else the new load state is LOW, then gradually deactivate the load
          else {
            // fade out from max to min in increments of 5 points:
            for (int fadeValue = 255; fadeValue >= 0; fadeValue -= 5) {
              // sets the value for the load (range from 0 to 255):
              analogWrite(loadPin, fadeValue);
              // wait for 30 milliseconds to see the fading effect
              delay(30);
            }
          }
        }

        // reset the receiver to receive the next code
        irrecv.resume();
    }
}
