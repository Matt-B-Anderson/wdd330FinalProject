const express = require("express");
const router = express.Router();
const path = require("path");

router.use(express.static(path.join(__dirname, "../client/src/public")));

module.exports = router;