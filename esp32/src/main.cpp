#include <WiFi.h>
#include <WebServer.h>
#include <EEPROM.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DHT_U.h>

#define EEPROM_SIZE 96
#define SSID_ADDR 0
#define PASS_ADDR 32
#define DHTPIN 15     // DHT11 sensörünün bağlı olduğu pin
#define DHTTYPE DHT11 // DHT11 sensör tipi

WebServer server(80);

String ssid = "";
String pass = "";
DHT_Unified dht(DHTPIN, DHTTYPE);
uint32_t delayMS = 2000; // Okuma aralığı (ms)

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
                "<input type='submit'></form><br>";
  html += "Bu sayfaya <b>" + WiFi.softAPIP().toString() + "</b> adresinden ulaşabilirsiniz.";
  server.send(200, "text/html", html);
}

void handleSave() {
  ssid = server.arg("ssid");
  String ssid_manual = server.arg("ssid_manual");
  if (ssid_manual.length() > 0) ssid = ssid_manual;
  pass = server.arg("pass");
  // EEPROM'a kaydet
  for (int i = 0; i < 32; i++) {
    EEPROM.write(SSID_ADDR + i, i < ssid.length() ? ssid[i] : 0);
    EEPROM.write(PASS_ADDR + i, i < pass.length() ? pass[i] : 0);
  }
  EEPROM.commit();
  String html = "Kaydedildi. Baglaniyor...<br>ESP yeniden başlatılıyor.";
  server.send(200, "text/html", html);
  delay(1000);
  ESP.restart();
}

void startAP() {
  WiFi.mode(WIFI_AP_STA); // Hem AP hem STA modunda olmalı ki tarama yapılabilsin
  WiFi.softAP("ESP32-Setup", "12345678", 1, 0, 1); // 1 istemci limiti
  delay(100); // AP başlatma sonrası kısa bekleme
  WiFi.scanNetworks(); // Tarama başlat
  server.on("/", handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.begin();
  Serial.print("AP modunda erişim için IP adresi: ");
  Serial.println(WiFi.softAPIP());
}

bool connectWiFi() {
  char savedSsid[33], savedPass[33];
  for (int i = 0; i < 32; i++) {
    savedSsid[i] = EEPROM.read(SSID_ADDR + i);
    savedPass[i] = EEPROM.read(PASS_ADDR + i);
  }
  savedSsid[32] = 0;
  savedPass[32] = 0;
  if (strlen(savedSsid) == 0) return false;
  WiFi.mode(WIFI_STA);
  WiFi.begin(savedSsid, savedPass);
  for (int i = 0; i < 30; i++) {
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("WiFi'ya bağlanıldı! IP adresi: ");
      Serial.println(WiFi.localIP());
      return true;
    }
    delay(500);
  }
  return false;
}

void setup() {
  Serial.begin(115200);
  EEPROM.begin(EEPROM_SIZE);
  dht.begin();

  // Sensör detaylarını seri porttan yazdır
  sensor_t sensor;
  dht.temperature().getSensor(&sensor);
  Serial.println(F("------------------------------------"));
  Serial.println(F("Sıcaklık Sensörü"));
  Serial.print  (F("Sensör Tipi: ")); Serial.println(sensor.name);
  Serial.print  (F("Driver Versiyon: ")); Serial.println(sensor.version);
  Serial.print  (F("Unique ID:   ")); Serial.println(sensor.sensor_id);
  Serial.print  (F("Max Değer:   ")); Serial.print(sensor.max_value); Serial.println(F("°C"));
  Serial.print  (F("Min Değer:   ")); Serial.print(sensor.min_value); Serial.println(F("°C"));
  Serial.print  (F("Çözünürlük:  ")); Serial.print(sensor.resolution); Serial.println(F("°C"));
  Serial.println(F("------------------------------------"));
  dht.humidity().getSensor(&sensor);
  Serial.println(F("Nem Sensörü"));
  Serial.print  (F("Sensör Tipi: ")); Serial.println(sensor.name);
  Serial.print  (F("Driver Versiyon: ")); Serial.println(sensor.version);
  Serial.print  (F("Unique ID:   ")); Serial.println(sensor.sensor_id);
  Serial.print  (F("Max Değer:   ")); Serial.print(sensor.max_value); Serial.println(F("%"));
  Serial.print  (F("Min Değer:   ")); Serial.print(sensor.min_value); Serial.println(F("%"));
  Serial.print  (F("Çözünürlük:  ")); Serial.print(sensor.resolution); Serial.println(F("%"));
  Serial.println(F("------------------------------------"));

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
  }
}

void loop() {
  if (WiFi.getMode() == WIFI_AP_STA || WiFi.getMode() == WIFI_AP) {
    server.handleClient();
  }

  static unsigned long lastDHT = 0;
  if (millis() - lastDHT > delayMS) {
    lastDHT = millis();
    sensors_event_t event;
    dht.temperature().getEvent(&event);
    if (isnan(event.temperature)) {
      Serial.println(F("Sıcaklık okuma hatası!"));
    } else {
      Serial.print(F("Sıcaklık: "));
      Serial.print(event.temperature);
      Serial.println(F("°C"));
    }
    dht.humidity().getEvent(&event);
    if (isnan(event.relative_humidity)) {
      Serial.println(F("Nem okuma hatası!"));
    } else {
      Serial.print(F("Nem: "));
      Serial.print(event.relative_humidity);
      Serial.println(F("%"));
    }
  }
}