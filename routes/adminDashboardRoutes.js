const { getDashboardOverviewDataCtrl } = require("../controllers/adminDashboardController");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

const router = require("express").Router();


// /api/admin/dashboard
router.get("/dashboard", verifyTokenAndAdmin, getDashboardOverviewDataCtrl);




module.exports = router;