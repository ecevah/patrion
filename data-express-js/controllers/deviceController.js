const axios = require("axios");
const influxService = require("../services/influxService");

const CHECK_MAC_URL = "http://localhost:3232/device/check-mac/";

async function checkMacAndQuery(req, res) {
  const { mac } = req.params;
  const { range = "1h", page = 1, limit = 10 } = req.query;
  const token = req.headers["authorization"];

  if (!token) {
    return res
      .status(401)
      .json({ status: false, message: "Authorization header missing" });
  }

  try {
    // Dış servise istek
    const response = await axios.get(`${CHECK_MAC_URL}${mac}`, {
      headers: { Authorization: token },
    });
    const result = response.data;

    if (!result.status) {
      return res.status(400).json({ status: false, message: result.message });
    }

    // MAC adresi sistemde kayıtlı değilse
    if (result.data && result.data.assigned === false) {
      return res.status(200).json({
        status: true,
        message: "MAC adresi sistemde kayıtlı değil.",
        data: null,
      });
    }

    // InfluxDB'den veri çek
    const influxResult = await influxService.queryMacData(
      mac,
      range,
      parseInt(page),
      parseInt(limit)
    );
    return res.status(200).json({
      status: true,
      message: "Başarılı",
      data: influxResult.data,
      pagination: influxResult.pagination,
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
}

async function getAllData(req, res) {
  const { page = 1, limit = 100 } = req.query;
  try {
    const result = await influxService.queryAllData(
      parseInt(limit),
      parseInt(page)
    );
    return res.status(200).json({
      status: true,
      message: "Başarılı",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
}

module.exports = {
  checkMacAndQuery,
  getAllData,
};
