const { getAllNearbyPlaces } = require("../controllers/nearbyplacesController");

const router = require("express").Router();


router.get("/", getAllNearbyPlaces)


module.exports = router;