const { getAllRoomsCtrl } = require("../controllers/roomsController");

const router = require("express").Router();



router.get("/", getAllRoomsCtrl);

module.exports = router;