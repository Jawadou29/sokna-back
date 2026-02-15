const { getAdminPropertiesCtrl } = require("../controllers/adminPropertiesController");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

const router = require("express").Router();




router.get("/", verifyTokenAndAdmin, getAdminPropertiesCtrl);


module.exports = router;