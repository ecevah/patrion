# ESP32 Temperature & Humidity MQTT Client

This project uses an ESP32 with a DHT11/DHT22 sensor to read temperature and humidity values and publish them securely to an MQTT broker using TLS/SSL.

## Features

- WiFi configuration via captive portal
- Secure MQTT communication with certificate-based authentication
- NTP time synchronization for accurate timestamps
- DHT11/DHT22 sensor reading
- JSON-formatted data publishing

## Hardware Requirements

- ESP32 development board
- DHT11 or DHT22 temperature and humidity sensor (connected to pin 15)

## Software Setup

### 1. Install Required Libraries

This project relies on the following libraries:

- DHT sensor library by Adafruit
- PubSubClient by Nick O'Leary
- NTPClient by Arduino Libraries
- Time by Paul Stoffregen
- ArduinoJson by Benoit Blanchon

All of these libraries can be installed via the PlatformIO Library Manager or Arduino Library Manager.

### 2. Configure MQTT Settings

Edit the `src/main.cpp` file to update your MQTT broker settings:

```cpp
const char* mqtt_server = "your-mqtt-server.com";
const int mqtt_port = 8883;
```

### 3. Add SSL Certificates

There are two ways to add SSL/TLS certificates:

#### Option 1: Embed in the code (preferred for development)

Edit the `src/main.cpp` file to include your certificates directly in the code:

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

#### Option 2: Upload to SPIFFS (preferred for production)

1. Create a `data` directory in your project root
2. Add your certificate files to this directory:
   - `ca.crt` - CA certificate
   - `client.crt` - Client certificate
   - `client.key` - Client private key
3. Upload the files to the ESP32's SPIFFS file system using PlatformIO:
   ```
   pio run --target uploadfs
   ```

## Usage

1. Flash the firmware to your ESP32
2. On first boot, the ESP32 will create an access point named "ESP32-Setup"
3. Connect to this AP with the password "12345678"
4. Open a web browser and navigate to the IP address displayed in the serial monitor (usually 192.168.4.1)
5. Configure your WiFi credentials and sensor ID
6. The ESP32 will restart and connect to your WiFi network
7. If successful, it will connect to the MQTT broker and start publishing sensor data

## MQTT Data Format

Data is published to the topic `XX:XX:XX:XX:XX:XX/data` where `XX:XX:XX:XX:XX:XX` is the MAC address of your ESP32. The payload is a JSON object with the following format:

```json
{
  "sensor_id": "temp_sensor_01",
  "timestamp": 1710772800,
  "temperature": 25.4,
  "humidity": 55.2
}
```

## Troubleshooting

- If you have issues with the certificates, check the format and make sure there are no extra spaces or line breaks
- Monitor the serial output for debug information (9600 baud)
- If the ESP32 is stuck in AP mode, try to clear the EEPROM by flashing a separate sketch to do so

## License

This project is open source and available under the MIT License.
