/*
  BTS Environment Management System
  ESP32 Intrusion Alert Example

  This sketch shows how the ESP32 calls the Vercel API when an
  intrusion is detected (e.g. a PIR sensor or door switch trips).
  The ESP32 only ever sends a stationId - all SMS credentials and
  the emergency phone number stay on the server.
*/

#include <WiFi.h>
#include <HTTPClient.h>

// ---- Update these for your network ----
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ---- Update this with your deployed Vercel URL ----
const char* API_URL = "https://your-project.vercel.app/api/sms";

// Must match this station's document ID in Firestore ("stations" collection)
const char* STATION_ID = "station001";

// Optional: only needed if DEVICE_SHARED_SECRET is set on the server
const char* DEVICE_SECRET = "";

// Example: intrusion sensor pin
const int INTRUSION_PIN = 4;

void connectToWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");
}

void sendIntrusionAlert() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping alert.");
    return;
  }

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  String payload = String("{\"stationId\":\"") + STATION_ID + "\"";
  if (strlen(DEVICE_SECRET) > 0) {
    payload += String(",\"deviceSecret\":\"") + DEVICE_SECRET + "\"";
  }
  payload += "}";

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("HTTP %d: %s\n", httpCode, response.c_str());
  } else {
    Serial.printf("HTTP request failed: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(INTRUSION_PIN, INPUT);
  connectToWiFi();
}

void loop() {
  if (digitalRead(INTRUSION_PIN) == HIGH) {
    Serial.println("Intrusion detected! Sending alert...");
    sendIntrusionAlert();
    delay(30000); // simple debounce: wait 30s before allowing another alert
  }

  delay(200);
}
