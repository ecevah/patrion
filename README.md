Test için: https://patrion.ahmetecevit.com adresinden demoya ulaşabilirsiniz.
Kullanıcı bilgileri için iletişime geçebilirsiniz.

## MQTT Broker Adresi
- mqtts://168.231.101.179:8883 (TLS/mTLS ile güvenli bağlantı)

# Sistem Mimarisi

![Mimari Diyagram](architecture.png)

Sistem, modern IoT ve veri işleme ihtiyaçlarına uygun olarak modüler ve ölçeklenebilir bir mimariyle tasarlanmıştır:

- **IoT Cihazları**: Sensörlerden alınan veriler MQTT protokolü ile güvenli bir şekilde **MQTT Broker**'a (TLS/mTLS) iletilir.
- **MQTT Broker**: Gelen verileri anında işler ve **InfluxDB** zaman serisi veritabanına kaydeder. Böylece sensör verileri kayıpsız ve hızlı şekilde arşivlenir.
- **WebSocket Sunucusu**: Kullanıcılar, gerçek zamanlı veri akışını takip edebilmek için belirli odalara bağlanabilir. WebSocket sunucusu, broker ile entegre çalışarak ilgili odalara canlı veri yayını yapar.
- **Data Backend**: Kullanıcılar, InfluxDB'ye doğrudan sorgular atabilir ve geçmiş sensör verilerine erişebilir. Bu katman, veri analitiği ve raporlama için optimize edilmiştir.
- **Core Backend**: Sitenin temel fonksiyonları (kullanıcı yönetimi, yetkilendirme, cihaz yönetimi, loglama vb.) bu katman üzerinden sağlanır. Ana veritabanı olarak **PostgreSQL** kullanılır.
- **Redis**: Sistem genelinde cache (önbellekleme) ve hızlı oturum yönetimi için Redis kullanılır. Bu sayede performans ve ölçeklenebilirlik artırılır.

Bu mimari sayesinde, IoT cihazlarından gelen veriler güvenli, hızlı ve esnek bir şekilde işlenir, saklanır ve kullanıcıya sunulur. Her katman bağımsız olarak ölçeklenebilir ve geliştirilebilir yapıdadır.

# Gereksinimler

- **Node.js** v22.13.1 ve üzeri
- **npm** 10.9.2 ve üzeri
- **Redis**
- **InfluxDB** 2.x
- **PostgreSQL**

# Kurulum ve Çalıştırma

## NestJS
```bash
npm install
npm run start
```

## data-express js
```bash
npm install
npm start
```

## mqtt
```bash
npm install
npm start
```

## ws
```bash
npm install
npm start
```

## next.js
```bash
npm install
npm run build
npm start
```

# ESP32 DHT11 Bağlantı
- VCC: 3V3
- GND: GND
- DOUT: D15
- Sertifikalar oluşturularak kullanılabilir.

# ER Diyagramı (Varlık-İlişki)

Aşağıda sistemin temel veri modelini gösteren ER diyagramı yer almaktadır:

![ER Diyagramı](patriondrawio.png)

Diyagramın düzenlenebilir haline `patrion.drawio` dosyasından ulaşabilirsiniz. (draw.io veya diagrams.net ile açabilirsiniz.)

---

# Postman Koleksiyonları

API'leri kolayca test edebilmeniz için iki adet Postman koleksiyonu eklenmiştir:

- `Data Service.postman_collection.json`
- `Core Service.postman_collection.json`

Bu dosyaları Postman uygulamasına import ederek, sistemdeki tüm uç noktaları kolayca test edebilirsiniz.

---
