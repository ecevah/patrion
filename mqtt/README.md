# MQTT Broker (Aedes) - mTLS ile Güvenli Bağlantı

## Sertifika Üretimi (OpenSSL ile)

### 1. CA (Certificate Authority) Oluştur
```sh
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -out ca.crt -subj "/CN=MyIoTCA"
```

### 2. Sunucu (Broker) Sertifikası Oluştur
```sh
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr -subj "/CN=localhost"
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 3650 -sha256
```

### 3. Her IoT Cihazı için Client Sertifikası Oluştur
```sh
openssl genrsa -out client1.key 2048
openssl req -new -key client1.key -out client1.csr -subj "/CN=client1"
openssl x509 -req -in client1.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client1.crt -days 3650 -sha256
```

> Her cihaz için farklı bir clientX.key/crt üretip, sadece o dosyaları cihaza kopyalayın.

## Broker'ı Başlatmak için
- `server.key`, `server.crt`, `ca.crt` dosyalarını broker ile aynı klasöre koyun.
- `npm start` ile başlatın.

## Client'ı Başlatmak için
- Her cihaz kendi `clientX.key`, `clientX.crt` ve `ca.crt` dosyasını kullanmalı.
- `node mqtt_client.js` ile çalıştırın.

## Güvenlik
- Sadece CA'nın imzaladığı client sertifikasına sahip cihazlar broker'a bağlanabilir.
- Sertifikalarınızı güvenli saklayın! 