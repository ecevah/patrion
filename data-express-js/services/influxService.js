const { InfluxDB } = require("@influxdata/influxdb-client");
const dotenv = require("dotenv");

dotenv.config();

const INFLUX_URL = process.env.INFLUX_URL;
const INFLUX_TOKEN = process.env.INFLUX_TOKEN;
const INFLUX_ORG = process.env.INFLUX_ORG;
const INFLUX_BUCKET = process.env.INFLUX_BUCKET;

const influxDB = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
const queryApi = influxDB.getQueryApi(INFLUX_ORG);

console.log(
  `\n=== InfluxDB Bağlantı Durumu ===\n🌊 InfluxDB'ye bağlanıldı: ${INFLUX_URL}\n🏢 Organization: ${INFLUX_ORG}\n🪣 Bucket: ${INFLUX_BUCKET}\n===============================\n`
);

function getEpochRange(range) {
  const now = Math.floor(Date.now() / 1000);
  let diff = 3600;
  switch (range) {
    case "1h":
      diff = 3600;
      break;
    case "6h":
      diff = 6 * 3600;
      break;
    case "1d":
      diff = 24 * 3600;
      break;
    case "1w":
      diff = 7 * 24 * 3600;
      break;
    default:
      diff = 3600;
  }
  return { lower: now - diff, upper: now };
}

async function queryMacData(mac, range = "1h", page = 1, limit = 10) {
  console.log(
    `[Influx] Sorgu başlatıldı: mac=${mac}, range=${range}, page=${page}, limit=${limit}`
  );
  const offset = (page - 1) * limit;
  let fluxQuery;
  let countQuery;

  if (range === "all") {
    fluxQuery = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -10y)
        |> filter(fn: (r) => r[\"_measurement\"] == \"sensor_data\")
        |> filter(fn: (r) => r[\"topic\"] == \"${mac}\")
        |> sort(columns: [\"_time\"], desc: true)
        |> limit(n: ${limit}, offset: ${offset})
    `;
    countQuery = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -10y)
        |> filter(fn: (r) => r[\"_measurement\"] == \"sensor_data\")
        |> filter(fn: (r) => r[\"topic\"] == \"${mac}\")
        |> count()
        |> keep(columns: [\"_value\"])
    `;
  } else {
    const { lower, upper } = getEpochRange(range);

    const start = new Date(lower * 1000).toISOString();
    const stop = new Date(upper * 1000).toISOString();

    fluxQuery = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: ${start}, stop: ${stop})
        |> filter(fn: (r) => r[\"_measurement\"] == \"sensor_data\")
        |> filter(fn: (r) => r[\"topic\"] == \"${mac}\")
        |> sort(columns: [\"_time\"], desc: true)
        |> limit(n: ${limit}, offset: ${offset})
    `;
    countQuery = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: ${start}, stop: ${stop})
        |> filter(fn: (r) => r[\"_measurement\"] == \"sensor_data\")
        |> filter(fn: (r) => r[\"topic\"] == \"${mac}\")
        |> count()
        |> keep(columns: [\"_value\"])
    `;
  }

  console.log("[Influx] Flux sorgusu:", fluxQuery);

  const rows = [];
  for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
    rows.push(tableMeta.toObject(values));
  }
  console.log(`[Influx] Sorgu sonucu satır sayısı: ${rows.length}`);

  let totalItem = 0;
  for await (const { values, tableMeta } of queryApi.iterateRows(countQuery)) {
    totalItem = tableMeta.toObject(values)._value;
  }
  const totalPage = Math.ceil(totalItem / limit);
  console.log(
    `[Influx] Toplam kayıt: ${totalItem}, Toplam sayfa: ${totalPage}`
  );

  return {
    data: rows,
    pagination: {
      total_item: totalItem,
      total_page: totalPage,
      current_page: page,
      limit: limit,
    },
  };
}

async function queryAllData(limit = 100, page = 1) {
  const offset = (page - 1) * limit;
  const fluxQuery = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: -10y)
      |> filter(fn: (r) => r["_measurement"] == "sensor_data")
      |> sort(columns: [\"_time\"], desc: true)
      |> limit(n: ${limit}, offset: ${offset})
  `;
  console.log("[Influx] [ALL DATA] Flux sorgusu:", fluxQuery);
  const rows = [];
  for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
    rows.push(tableMeta.toObject(values));
  }
  let totalItem = 0;
  const countQuery = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: -10y)
      |> filter(fn: (r) => r["_measurement"] == "sensor_data")
      |> count()
      |> keep(columns: [\"_value\"])
  `;
  for await (const { values, tableMeta } of queryApi.iterateRows(countQuery)) {
    totalItem = tableMeta.toObject(values)._value;
  }
  const totalPage = Math.ceil(totalItem / limit);
  return {
    data: rows,
    pagination: {
      total_item: totalItem,
      total_page: totalPage,
      current_page: page,
      limit: limit,
    },
  };
}

module.exports = {
  queryMacData,
  queryAllData,
};
