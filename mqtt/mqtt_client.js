const mqtt = require("mqtt");
const fs = require("fs");

const brokerUrl = "mqtts://168.231.101.179:8883";
const topic = "DE:AD:BE:EF:00:01/data";

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
      timestamp: Math.floor(Date.now() / 1000),
      temperature: (20 + Math.random() * 10).toFixed(2),
      humidity: (40 + Math.random() * 20).toFixed(2),
    };
    client.publish(topic, JSON.stringify(message));
    console.log(`Mesaj gönderildi: ${JSON.stringify(message)}`);
  }, 10000);
});

client.on("error", (err) => {
  console.error("MQTT client hata:", err);
});
