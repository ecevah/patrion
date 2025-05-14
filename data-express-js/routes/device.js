const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/deviceController");

router.get("/check-mac/:mac", deviceController.checkMacAndQuery);

//router.get("/all-data", deviceController.getAllData);

module.exports = router;
