# Cihaz ve Yetkilendirme Sistemi Dökümantasyonu

## Genel Bakış
Bu proje, NestJS ile geliştirilmiş JWT tabanlı kimlik doğrulama ve rol/izin tabanlı yetkilendirme içeren bir cihaz yönetim sistemidir. Kullanıcılar, sahip oldukları rol ve izinlere göre cihazlara erişebilir, yeni cihaz ekleyebilir, güncelleyebilir veya silebilir.

---

## Yetkilendirme Sistemi

### Roller ve İzinler
- **System Admin:** Tüm cihazlara ve işlemlere tam erişim.
- **can_assign_device:** Kendi şirketinin tüm cihazlarını görebilir.
- **can_view_data:** Sadece kendisine atanmış cihazları görebilir.

İzinler, kullanıcıya JWT ile atanır ve her istek sırasında middleware tarafından kontrol edilir.

### Decorator Kullanımı
- `@Permission('izin_adi')`: Sadece belirtilen izne sahip kullanıcılar erişebilir.
- `@Permissions('izin1', 'izin2')`: Belirtilen izinlerden herhangi birine sahip olan kullanıcılar erişebilir.

Örnek:
```typescript
@Permissions('can_assign_device', 'can_view_data')
@Get('authorized-devices')
async getAuthorizedDevices(@Req() req) { ... }
```

---

## Cihaz Listeleme Endpointleri

### 1. Yetkiye Göre Cihaz Listesi

#### Endpoint
```
GET /device/authorized-devices
```

#### Açıklama
Kullanıcının rol ve izinlerine göre cihaz listesi döner:
- **System Admin:** Sistemdeki tüm cihazları görür.
- **can_assign_device:** Sadece kendi şirketinin cihazlarını görür.
- **can_view_data:** Sadece kendisine atanmış cihazları görür.
- **Hiçbir yetkisi yoksa:** 403 Forbidden hatası döner.

#### Yanıt Örneği
```json
{
  "status": true,
  "message": "Yetkilerinize göre cihazlar başarıyla listelendi",
  "data": [
    {
      "id": 1,
      "name": "Cihaz1",
      "company": { "id": 1, "name": "Firma A" },
      "mac": "AA:BB:CC:DD:EE:FF",
      "mqtt_topic": "topic1",
      "create_by": { "id": 1, "username": "admin" },
      "update_by": { "id": 1, "username": "admin" }
    }
  ]
}
```

#### Hata Yanıtı
```json
{
  "statusCode": 403,
  "message": "Bu işlemi gerçekleştirmek için gerekli yetkilere sahip değilsiniz",
  "error": "Permission Denied",
  "required": ["can_assign_device", "can_view_data"]
}
```

---

## Yetkilendirme Akışı
1. **JWT Doğrulama:** Her istek AuthMiddleware tarafından JWT ile doğrulanır ve kullanıcı bilgisi `req.user`'a eklenir.
2. **PermissionGuard:** Route üzerinde tanımlı izin/decorator ile kullanıcının yetkisi kontrol edilir.
3. **Controller:** Kullanıcıya uygun cihazlar veya işlemler döndürülür.

---

## JWT Payload Örneği
```json
{
  "userId": 5,
  "username": "ali",
  "role": "User",
  "companyId": 2,
  "permissions": {
    "can_assign_device": false,
    "can_view_data": true,
    "can_manage_iot": false
  }
}
```

---

## Ek Notlar
- System Admin rolü, tüm izinleri otomatik olarak geçerli sayılır.
- İzinler Redis ile cache'lenir, performans için optimize edilmiştir.
- Hatalar ve loglar detaylı şekilde tutulur.

---

