#include <WiFi.h>
#include <WebServer.h>
#include <EEPROM.h>
#include <DHT.h>

#define EEPROM_SIZE 96
#define SSID_ADDR 0
#define PASS_ADDR 32
#define DHTPIN 15      // DHT11 data pin
#define DHTTYPE DHT11  // DHT11 sensör tipi

WebServer server(80);

String ssid = "";
String pass = "";
DHT dht(DHTPIN, DHTTYPE);

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

  // Her 2 saniyede bir DHT11 oku ve konsola yaz
  static unsigned long lastDHT = 0;
  if (millis() - lastDHT > 2000) {
    lastDHT = millis();
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    if (isnan(h) || isnan(t)) {
      Serial.println("DHT11 okunamadı!");
    } else {
      Serial.print("Sıcaklık: ");
      Serial.print(t);
      Serial.print(" °C, Nem: ");
      Serial.print(h);
      Serial.println(" %");
    }
  }
}