const { getAllOffersCtrl } = require("../controllers/offersController");

const router = require("express").Router();

router.get("/", getAllOffersCtrl);

module.exports = router;