const { getResetPasswordLinkCtrl, sendResetPasswordLinkCtrl, resetPasswordCtrl } = require("../controllers/passwordController");


const router = require("express").Router();

// /api/password/rest-password-link
router.post("/reset-password-link", sendResetPasswordLinkCtrl);

// /api/password/reset-password/:userId/:token
router.get("/reset-password/:userId/:token", getResetPasswordLinkCtrl);
router.post("/reset-password/:userId/:token", resetPasswordCtrl);


module.exports = router;