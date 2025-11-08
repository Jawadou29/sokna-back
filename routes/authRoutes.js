const { registerUserCtrl, loginUserCtrl, verifyUserAccountCtrl } = require("../controllers/authController");
const uploadImage = require("../middlewares/uploadImage");
const router = require("express").Router();


// api/auth/register
router.post("/register", uploadImage.single("photoProfile"), registerUserCtrl);
// api/auth/login
router.post("/login",  loginUserCtrl);

// api/auth/:userId/verify/:token
router.get("/:userId/verify/:token", verifyUserAccountCtrl);



module.exports = router;