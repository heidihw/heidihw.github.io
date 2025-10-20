/*
  Input

  Built with Examples/03.Analog/AnalogInOutSerial

  The 3 LEDs get brighter when the environment gets dimmer
  and dimmer when the environment gets brighter.

  The LEDs are attached to pins 9, 10, and 11.
  The photocell is connected to 5V power and analog input through pin A5.

  modified 20 Oct 2025
  by Heidi Wang
*/

// the number of the input pin for the photocell
const int meterPin = A5;
// the number of the pin for the Red LED
const int ledPinR = 11;
// the number of the pin for the Green LED
const int ledPinG = 10;
// the number of the pin for the Blue LED
const int ledPinB = 9;

// the value read as input from the photocell
int sensorValue = 0;
// the last value of sensorValue
int lastIn = 0;
// the value to be written as output to the LEDs
int outputValue = 0;

// the setup function runs one time when the program is started
void setup()
{
  // initialize the sensor pin as an input
  pinMode(meterPin, INPUT);
  // initialize the Red LED pin as an output
  pinMode(ledPinR, OUTPUT);
  // initialize the Green LED pin as an output
  pinMode(ledPinG, OUTPUT);
  // initialize the Blue LED pin as an output
  pinMode(ledPinB, OUTPUT);
  // begin serial communication
  Serial.begin(9600);
}

// the loop function loops indefinitely
void loop()
{
  // read the analog in value in 10bit:
  sensorValue = analogRead(meterPin);
  // map it from 10bit to the range of the analog out in 8bit:
  outputValue = map(sensorValue, 0, 1023, 0, 255);
  // write the analog out value to the output pins:
  analogWrite(ledPinR, 255-outputValue);
  analogWrite(ledPinG, 255-outputValue);
  analogWrite(ledPinB, 255-outputValue);

  // print the results to the serial monitor:
  Serial.print("sensor = ");
  Serial.print(sensorValue);
  Serial.print("\t output = ");
  Serial.print(outputValue);
  // print whether the sensor value increased or decreased
  if (sensorValue > lastIn) {
    // sensor value increased; print message accordingly
    Serial.println("\t +++++ brighter, less resistance, more voltage")
  } else {
    // sensor value decreased; print message accordingly
    Serial.println("\t -----   dimmer, more resistance, less voltage")
  }
  // update lastIn to prepare for the next loop
  lastIn = sensorValue

  // wait 2 milliseconds before the next loop for the
  // analog-to-digital converter to settle after the
  // last reading:
  delay(2);
}
