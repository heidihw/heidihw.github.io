/*
  Web

  with help from servo-with-gui by Blair Subbaraman

  2025 November 18
  Heidi Wang
*/

int sensorPin = A0;
int outputPin = 8;

void setup() {
  Serial.begin(9600);
  pinMode(outputPin, OUTPUT);
}

void loop() {
  // write the sensor data
  Serial.println(analogRead(sensorPin));

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
