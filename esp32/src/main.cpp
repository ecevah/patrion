#include <WiFi.h>
#include <WebServer.h>
#include <EEPROM.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DHT_U.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <SPIFFS.h>
#include "ca_crt.h"
#include "client_crt.h"
#include "client_key.h"

#define EEPROM_SIZE 160
#define SSID_ADDR 0
#define PASS_ADDR 32
#define SENSOR_ID_ADDR 64
#define DHTPIN 15     
#define DHTTYPE DHT11 

String ssid = "";
String pass = "";
String sensor_id = "temp_sensor_01";

WebServer server(80);
WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);
DHT_Unified dht(DHTPIN, DHTTYPE);
uint32_t delayMS = 2000; 


const char* mqtt_server = "192.168.1.7";
const int mqtt_port = 8883;
const char* mqtt_username = ""; 
const char* mqtt_password = ""; 
String mqtt_topic;

void setupMQTT() {
  espClient.setCACert((const char*)data_ca_crt);
  espClient.setCertificate((const char*)data_client_crt);
  espClient.setPrivateKey((const char*)data_client_key);

  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setKeepAlive(60);

  
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char macStr[18];
  snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X", 
          mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  mqtt_topic = String(macStr) + "/data";

  Serial.print("MQTT Topic: ");
  Serial.println(mqtt_topic);
}

String getNetworksList() {
  int n = WiFi.scanNetworks();
  String options = "";
  for (int i = 0; i < n; ++i) {
    String ssidItem = WiFi.SSID(i);
    options += "<option value='" + ssidItem + "'>" + ssidItem + "</option>";
  }
  return options;
}

void handleRoot() {
  String html = "<form action='/save' method='POST'>"
                "SSID: <select name='ssid'>" + getNetworksList() + "</select><br>"
                "veya elle gir: <input name='ssid_manual'><br>"
                "Password: <input name='pass' type='password'><br>"
                "Sensör ID: <input name='sensor_id' value='" + sensor_id + "'><br>"
                "<input type='submit'></form><br>";
  html += "Bu sayfaya <b>" + WiFi.softAPIP().toString() + "</b> adresinden ulaşabilirsiniz.";
  server.send(200, "text/html", html);
}

void handleSave() {
  ssid = server.arg("ssid");
  String ssid_manual = server.arg("ssid_manual");
  if (ssid_manual.length() > 0) ssid = ssid_manual;
  pass = server.arg("pass");
  sensor_id = server.arg("sensor_id");
  if (sensor_id.length() == 0) {
    sensor_id = "temp_sensor_01";
  }
  for (int i = 0; i < 32; i++) {
    EEPROM.write(SSID_ADDR + i, i < ssid.length() ? ssid[i] : 0);
    EEPROM.write(PASS_ADDR + i, i < pass.length() ? pass[i] : 0);
    EEPROM.write(SENSOR_ID_ADDR + i, i < sensor_id.length() ? sensor_id[i] : 0);
  }
  EEPROM.commit();
  String html = "Kaydedildi. Bağlanıyor...<br>ESP yeniden başlatılıyor.";
  server.send(200, "text/html", html);
  delay(1000);
  ESP.restart();
}

void startAP() {
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP("ESP32-Setup", "12345678", 1, 0, 1);
  delay(100);
  WiFi.scanNetworks();
  server.on("/", handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.begin();
  Serial.print("AP modunda erişim için IP adresi: ");
  Serial.println(WiFi.softAPIP());
}

bool connectWiFi() {
  char savedSsid[33], savedPass[33], savedSensorId[33];
  for (int i = 0; i < 32; i++) {
    savedSsid[i] = EEPROM.read(SSID_ADDR + i);
    savedPass[i] = EEPROM.read(PASS_ADDR + i);
    savedSensorId[i] = EEPROM.read(SENSOR_ID_ADDR + i);
  }
  savedSsid[32] = 0;
  savedPass[32] = 0;
  savedSensorId[32] = 0;
  if (strlen(savedSsid) == 0) return false;
  sensor_id = String(savedSensorId);
  if (sensor_id.length() == 0) {
    sensor_id = "temp_sensor_01";
  }
  WiFi.mode(WIFI_STA);
  WiFi.begin(savedSsid, savedPass);
  for (int i = 0; i < 30; i++) {
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("WiFi'ya bağlanıldı! IP adresi: ");
      Serial.println(WiFi.localIP());
      return true;
    }
    delay(500);
    Serial.print(".");
  }
  return false;
}

void publishSensorData(float temperature, float humidity) {
  if (!mqttClient.connected()) {
    
    return;
  }
  DynamicJsonDocument doc(128);
  doc["sensor_id"] = sensor_id;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  char buffer[128];
  size_t n = serializeJson(doc, buffer);
  Serial.print("MQTT'ye gönderiliyor: ");
  Serial.println(buffer);
  if (mqttClient.publish(mqtt_topic.c_str(), buffer)) {
    Serial.println("Yayınlama başarılı");
  } else {
    Serial.println("Yayınlama hatası!");
  }
}

bool reconnectMQTT() {
  if (!mqttClient.connected()) {
    String clientId = "ESP32-" + String(random(0xffff), HEX);
    if (strlen(mqtt_username) > 0) {
      return mqttClient.connect(clientId.c_str(), mqtt_username, mqtt_password);
    } else {
      return mqttClient.connect(clientId.c_str());
    }
  }
  return true;
}

void setup() {
  Serial.begin(9600);
  EEPROM.begin(EEPROM_SIZE);
  dht.begin();

  int tryCount = 0;
  bool connected = false;
  while (tryCount < 3) {
    if (connectWiFi()) {
      connected = true;
      break;
    }
    tryCount++;
  }
  if (!connected) {
    WiFi.disconnect(true);
    delay(1000);
    startAP();
  } else {
    setupMQTT();
  }
}

void loop() {
  if (WiFi.getMode() == WIFI_AP_STA || WiFi.getMode() == WIFI_AP) {
    server.handleClient();
  } else if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      reconnectMQTT();
    }
    mqttClient.loop();
    static unsigned long lastDHT = 0;
    if (millis() - lastDHT > delayMS) {
      lastDHT = millis();
      float temperature = NAN;
      float humidity = NAN;
      sensors_event_t event;
      dht.temperature().getEvent(&event);
      if (!isnan(event.temperature)) {
        temperature = event.temperature;
        Serial.print(F("Sıcaklık: "));
        Serial.print(temperature);
        Serial.println(F("°C"));
      } else {
        Serial.println(F("Sıcaklık okuma hatası!"));
      }
      dht.humidity().getEvent(&event);
      if (!isnan(event.relative_humidity)) {
        humidity = event.relative_humidity;
        Serial.print(F("Nem: "));
        Serial.print(humidity);
        Serial.println(F("%"));
      } else {
        Serial.println(F("Nem okuma hatası!"));
      }
      if (!isnan(temperature) && !isnan(humidity)) {
        publishSensorData(temperature, humidity);
      }
    }
  }
}

