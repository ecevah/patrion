import WebSocket, { WebSocketServer } from "ws";
import axios from "axios";
import mqtt from "mqtt";
import fs from "fs";
import path from "path";

const WS_PORT = 8080;
const API_URL = "http://localhost:3232/device/authorized-devices";

// Sertifika dosyalarını oku
const CERT_DIR = path.resolve("certificates");
const ca = fs.readFileSync(path.join(CERT_DIR, "ca.crt"));
const cert = fs.readFileSync(path.join(CERT_DIR, "client.crt"));
const key = fs.readFileSync(path.join(CERT_DIR, "client.key"));

// Her topic için tek bir MQTT bağlantısı tutmak için
const mqttClients = {};
// Hangi client hangi topic'leri dinliyor?
const topicSubscribers = {};

const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", async (ws, req) => {
  // İlk mesajda JWT token bekliyoruz
  ws.once("message", async (message) => {
    let token;
    try {
      const data = JSON.parse(message);
      token = data.token;
      if (!token) throw new Error("Token gerekli!");
    } catch (err) {
      ws.send(
        JSON.stringify({ error: "Geçersiz bağlantı formatı veya token yok." })
      );
      ws.close();
      return;
    }

    // API'ye yetkili cihazlar için istek at
    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const devices = response.data?.data || [];
      if (!Array.isArray(devices) || devices.length === 0) {
        ws.send(JSON.stringify({ error: "Yetkili cihaz bulunamadı." }));
        ws.close();
        return;
      }
      // Kullanıcının dinleyeceği topic'ler
      const topics = devices.map((d) => d.mqtt_topic).filter(Boolean);
      ws.topics = topics;
      ws.token = token;

      // Her topic için abone ol ve client'ı kaydet
      topics.forEach((topic) => {
        if (!topicSubscribers[topic]) topicSubscribers[topic] = new Set();
        topicSubscribers[topic].add(ws);
        if (!mqttClients[topic]) {
          // Her topic için tek bir MQTT client aç, TLS ile bağlan
          const client = mqtt.connect("mqtts://localhost:8883", {
            ca,
            cert,
            key,
            rejectUnauthorized: true,
          });
          mqttClients[topic] = client;
          client.on("connect", () => {
            client.subscribe(topic, (err) => {
              if (err) console.error("MQTT subscribe error:", err);
            });
          });
          client.on("message", (msgTopic, payload) => {
            // Sadece ilgili topic'e abone olanlara mesajı ilet
            if (topicSubscribers[msgTopic]) {
              topicSubscribers[msgTopic].forEach((clientWs) => {
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(
                    JSON.stringify({
                      topic: msgTopic,
                      payload: payload.toString(),
                    })
                  );
                }
              });
            }
          });
        }
      });

      ws.send(JSON.stringify({ success: true, topics }));
    } catch (err) {
      ws.send(
        JSON.stringify({
          error:
            "API isteği başarısız: " +
            (err.response?.data?.message || err.message),
        })
      );
      ws.close();
      return;
    }
  });

  ws.on("close", () => {
    // Bağlantı kapanınca abone listesinden çıkar
    if (ws.topics) {
      ws.topics.forEach((topic) => {
        if (topicSubscribers[topic]) {
          topicSubscribers[topic].delete(ws);
          // Eğer o topic'e abone kalan yoksa MQTT bağlantısını kapat
          if (topicSubscribers[topic].size === 0) {
            mqttClients[topic]?.end();
            delete mqttClients[topic];
            delete topicSubscribers[topic];
          }
        }
      });
    }
  });
});

console.log(
  `WebSocket sunucusu ws://localhost:${WS_PORT} adresinde çalışıyor.`
);
