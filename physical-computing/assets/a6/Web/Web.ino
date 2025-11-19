/*
  Web

  with help from servo-with-gui by Blair Subbaraman

  Prints 3 input values (X, Y, switch) from the joystick to serial output.
  Reads a boolean 1 or 0 from serial input to turn on or off the output device.

  The joystick is connected to X pin A0, Y pin A1, switch pin 2.
  The output device is connected to pin 7.

  2025 November 18
  Heidi Wang
*/

// pin for joystick X input
int xPin = A0;
// pin for joystick Y input
int yPin = A1;
// pin for joystick switch input
int switchPin = 2;
// pin for output device
int outputPin = 8;

// runs once
void setup() {
  // begin serial communication
  Serial.begin(9600);
  // provide power to the switch to allow it to begin working
  digitalWrite(switchPin, HIGH);
  // initialize the output pin as output
  pinMode(outputPin, OUTPUT);
}

// repeats indefinitely
void loop() {
  // write the x value from the joystick
  Serial.print(analogRead(xPin));
  // write a comma to delimit values
  Serial.print(",");
  // write the y value from the joystick
  Serial.print(analogRead(yPin));
  // write a comma to delimit values
  Serial.print(",");
  // write the switch value from the joystick and a \n char to complete a transmission
  Serial.println(digitalRead(switchPin));

  // if there's serial data
  if (Serial.available() > 0) {
    // read it
 	  int val = Serial.read();

    // use it to update the output pin
 	  if (val==1) {
      digitalWrite(outputPin, HIGH);
    }
    if (val==0) {
      digitalWrite(outputPin, LOW);
    }
  }

  // delay between actions
  delay(50);
}
