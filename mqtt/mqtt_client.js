const mqtt = require("mqtt");
const fs = require("fs");

const brokerUrl = "mqtts://192.168.1.7:8883";
const topic = "10:20:30/data";

const options = {
  key: fs.readFileSync("client.key"),
  cert: fs.readFileSync("client.crt"),
  ca: fs.readFileSync("ca.crt"),
  rejectUnauthorized: true,
};

const client = mqtt.connect(brokerUrl, options);

client.on("connect", () => {
  console.log("MQTT client broker'a bağlandı (TLS/mTLS).");
  setInterval(() => {
    const message = {
      sensor_id: "temp_sensor_01",
      timestamp: 1710772800, // örnek sabit zaman damgası
      temperature: 25.4,
      humidity: 55.2,
    };
    client.publish(topic, JSON.stringify(message));
    console.log(`Mesaj gönderildi: ${JSON.stringify(message)}`);
  }, 10000); // 10 saniye
});

client.on("error", (err) => {
  console.error("MQTT client hata:", err);
});
