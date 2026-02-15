const { getAdminUsersCtrl } = require("../controllers/adminUsersController");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

const router = require("express").Router();


router.get("/", verifyTokenAndAdmin, getAdminUsersCtrl);


module.exports = router;