/*
  Blink3

  Turns 3 LEDs on for one second, then off for one second, repeatedly, one after another.

  The LEDs are attached to pins 5, 8, and 11.

  modified 1 Oct 2025
  by Heidi Wang
*/

// the setup function runs once when you press reset or power the board
void setup()
{
  // initialize pin 5 as an output
  pinMode(5, OUTPUT);
  // initialize pin 8 as an output
  pinMode(8, OUTPUT);
  // initialize pin 11 as an output
  pinMode(11, OUTPUT);
}

// a helper function to blink the given LED
void blink(int led)
{
  // turn the LED on (HIGH is the voltage level)
  digitalWrite(led, HIGH);
  // wait for a second (1000 milliseconds)
  delay(500);
  // turn the LED off by making the voltage LOW
  digitalWrite(led, LOW);
  // wait for a second (1000 milliseconds)
  delay(200);
}

// the loop function runs over and over again forever
void loop()
{
  // calls the blink function for pin 5
  blink(5);
  // calls the blink function for pin 8
  blink(8);
  // calls the blink function for pin 11
  blink(11);
}
