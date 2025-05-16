# ESP32 Sıcaklık & Nem MQTT İstemcisi

Bu proje, ESP32 ve DHT11/DHT22 sensörü kullanarak sıcaklık ve nem değerlerini okur ve bu verileri TLS/SSL ile güvenli bir şekilde bir MQTT sunucusuna yayınlar.

## Özellikler

- Captive portal ile WiFi yapılandırması
- Sertifika tabanlı kimlik doğrulama ile güvenli MQTT iletişimi
- Doğru zaman damgası için NTP zaman senkronizasyonu
- DHT11/DHT22 sensör okuma
- JSON formatında veri yayını

## Donanım Gereksinimleri

- ESP32 geliştirme kartı
- DHT11 veya DHT22 sıcaklık ve nem sensörü (15 numaralı pine bağlı)

## Yazılım Kurulumu

### 1. Gerekli Kütüphanelerin Kurulumu

Bu proje aşağıdaki kütüphaneleri kullanır:

- Adafruit DHT sensör kütüphanesi
- Nick O'Leary tarafından PubSubClient
- Arduino Libraries tarafından NTPClient
- Paul Stoffregen tarafından Time
- Benoit Blanchon tarafından ArduinoJson

Tüm bu kütüphaneler PlatformIO veya Arduino Library Manager üzerinden kurulabilir.

### 2. MQTT Ayarlarını Yapılandırma

`src/main.cpp` dosyasını düzenleyerek MQTT sunucu ayarlarını girin:

```cpp
const char* mqtt_server = "your-mqtt-server.com";
const int mqtt_port = 8883;
```

### 3. SSL Sertifikalarını Ekleme

İki şekilde SSL/TLS sertifikası ekleyebilirsiniz:

#### Seçenek 1: Koda gömülü (geliştirme için önerilir)

`src/main.cpp` dosyasına sertifikalarınızı doğrudan ekleyin:

```cpp
const char* default_ca_cert = "-----BEGIN CERTIFICATE-----\n"
                              "YOUR_CA_CERTIFICATE_HERE\n"
                              "-----END CERTIFICATE-----\n";

const char* default_client_cert = "-----BEGIN CERTIFICATE-----\n"
                                  "YOUR_CLIENT_CERTIFICATE_HERE\n"
                                  "-----END CERTIFICATE-----\n";

const char* default_client_key = "-----BEGIN PRIVATE KEY-----\n"
                                 "YOUR_CLIENT_PRIVATE_KEY_HERE\n"
                                 "-----END PRIVATE KEY-----\n";
```

#### Seçenek 2: SPIFFS'e yükleme (prodüksiyon için önerilir)

1. Proje kök dizininde `data` klasörü oluşturun
2. Sertifika dosyalarınızı bu klasöre ekleyin:
   - `ca.crt` - CA sertifikası
   - `client.crt` - İstemci sertifikası
   - `client.key` - İstemci özel anahtarı
3. PlatformIO ile dosyaları ESP32'nin SPIFFS dosya sistemine yükleyin:
   ```
   pio run --target uploadfs
   ```

## Kullanım

1. Yazılımı ESP32'ye yükleyin
2. İlk açılışta ESP32, "ESP32-Setup" adında bir erişim noktası oluşturur
3. Bu ağa "12345678" şifresiyle bağlanın
4. Seri monitörde görünen IP adresine (genellikle 192.168.4.1) tarayıcıdan girin
5. WiFi bilgilerinizi ve sensör ID'nizi girin
6. ESP32 yeniden başlar ve WiFi ağına bağlanır
7. Bağlantı başarılıysa MQTT sunucusuna bağlanır ve sensör verilerini yayınlamaya başlar

## MQTT Veri Formatı

Veriler, ESP32'nin MAC adresine özel `XX:XX:XX:XX:XX:XX/data` konusuna yayınlanır. Gönderilen veri aşağıdaki JSON formatındadır:

```json
{
  "sensor_id": "temp_sensor_01",
  "timestamp": 1710772800,
  "temperature": 25.4,
  "humidity": 55.2
}
```

## Sorun Giderme

- Sertifikalarla ilgili sorun yaşarsanız, formatı ve fazladan boşluk/karakter olup olmadığını kontrol edin
- Seri çıkışını (9600 baud) hata ayıklama için izleyin
- ESP32 AP modunda takılı kalırsa, EEPROM'u temizleyen ayrı bir kod yüklemeyi deneyin

# ESP32 DHT11 Bağlantı
- VCC: 3V3
- GND: GND
- DOUT: D15
- Sertifikalar oluşturularak kullanılabilir.

## Bağlantı Şeması

![ESP32 DHT11 Bağlantı Şeması](esp-dht11.png)

---

