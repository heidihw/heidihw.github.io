/*
  Libraries

  Built with Examples/CapacitiveSensor/CapacitiveSensorSketch and Examples/Servo/Knob

  The servo motor points right when the capacitor is activated
  and left when the capacitor is deactivated.

  The servo motor output is attached to pin 6.
  The capacitor input is attached to pin 4 for send and pin 2 for receive.

  modified 26 Oct 2025
  by Heidi Wang
*/

#include <CapacitiveSensor.h>
#include <Servo.h>

// 1 megaohm resistor between pins 4 & 2,
// pin 2 is sensor pin, add wire, metal capacitive surface
CapacitiveSensor cs_4_2 = CapacitiveSensor(4,2);
// initialize servo object
Servo myServo;
// the number of the write pin for the servo
const int servoPin = 6;

// the threshold for activating the capacitive sensor; change as needed
int threshold = 240;

// the setup function runs one time when the program is started
void setup()
{
  // attach servo object to servo pin
  myServo.attach(servoPin);
  // begin serial communication at 9600 bits/s (baud)
  Serial.begin(9600);
}

// the loop function loops indefinitely
void loop()
{
  // read in the capacitive sensor value over 30 samples of measurement
  long sensorValue = cs_4_2.capacitiveSensor(30);
  // print the sensor value
  Serial.println(sensorValue);

  // rotate the servo depending on whether the sensor value passed the threshold
  if (sensorValue > threshold) {
    // rotate the servo to the right when the sensor is activated
    myServo.write(180);
  } else {
    // rotate the servo to the left when the sensor is deactivated
    myServo.write(0);
  }

  // delay 15ms between reads
  delay(15);
}
