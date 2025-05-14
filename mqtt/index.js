const aedes = require("aedes")();
const fs = require("fs");
const tls = require("tls");
const { InfluxDB, Point } = require("@influxdata/influxdb-client");

const PORT = 8883;

const options = {
  key: fs.readFileSync("server.key"),
  cert: fs.readFileSync("server.crt"),
  ca: [fs.readFileSync("ca.crt")],
  requestCert: true,
  rejectUnauthorized: true,
};

const server = tls.createServer(options, aedes.handle);

// InfluxDB 2.x bağlantı ayarları (örnek değerler, kendi bilgilerinle değiştir)
const INFLUX_URL = "http://localhost:8086";
const INFLUX_TOKEN =
  "JE2SqvCqG1hZa3mNcKznquR3ysEI7HuxDMcDhoUQLqvqKf5Pphoex8D7GRBAcUq9k5h6HQ1qDXZkgy_o5fgNiA==";
const INFLUX_ORG = "vanetra";
const INFLUX_BUCKET = "patrion";

const influxDB = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
const writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET, "ns");

server.listen(PORT, function () {
  console.log("MQTT broker TLS ile 8883 portunda çalışıyor");
});

aedes.on("client", function (client) {
  console.log(`Yeni client bağlandı: ${client ? client.id : client}`);
});

aedes.on("clientDisconnect", function (client) {
  console.log(`Client ayrıldı: ${client ? client.id : client}`);
});

aedes.on("subscribe", function (subscriptions, client) {
  if (client) {
    subscriptions.forEach((sub) => {
      console.log(`Client ${client.id} '${sub.topic}' konusuna abone oldu.`);
    });
  }
});

aedes.on("publish", function (packet, client) {
  if (client) {
    console.log(
      `Client ${client.id} '${
        packet.topic
      }' konusuna mesaj gönderdi: ${packet.payload.toString()}`
    );
    try {
      const topic = packet.topic;
      if (topic.endsWith("/data")) {
        const mainTopic = topic.replace(/\/data$/, "");
        const payload = JSON.parse(packet.payload.toString());
        const point = new Point("sensor_data")
          .tag("topic", mainTopic)
          .tag("sensor_id", payload.sensor_id)
          .floatField("temperature", payload.temperature)
          .floatField("humidity", payload.humidity)
          .intField("timestamp", payload.timestamp)
          .timestamp(new Date(payload.timestamp * 1000));
        writeApi.writePoint(point);
        writeApi
          .flush()
          .then(() => {
            console.log("InfluxDB'ye veri yazıldı.");
          })
          .catch((err) => {
            console.error("InfluxDB yazma hatası:", err);
          });
      }
    } catch (err) {
      console.error("Mesaj işleme hatası:", err);
    }
  }
});
