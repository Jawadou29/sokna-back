const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const {User, validateEmail, validateNewPassword} = require("../models/User");
const VerificationToken = require("../models/VerificationToken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { passwordMessages } = require("../translations/password");

/**-----------------------------------
 * @desc send reset password link
 * @route /api/password/reset-password-link
 * @method POST
 * @access public
-------------------------------------*/
const sendResetPasswordLinkCtrl = asyncHandler(async (req, res) => {
  // validate email
  const { error } = validateEmail(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message});
  }
  // get user from db
  const user = await User.findOne({email: req.body.email});
  if (!user) {
    return res.status(404).json({message: passwordMessages[req.lang].EmailNotFound});
  }
  // create Verification Token
  let verificationToken = await VerificationToken.findOne({userId: user._id});
  if (!verificationToken) {
    verificationToken = new VerificationToken({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex")
    })
  }
  await verificationToken.save();
  
  // creating link
  const link = `${process.env.CLIENT_DOMAIN}/reset-password/${user._id}/${verificationToken.token}`;
  // create html template
  const htmlTemplate = `<a href=${link}>reset your password</a>`;
  // send link to temail
  await sendEmail(user.email, "Reset your password", htmlTemplate);
  // response to client
  res.status(200).json({message: passwordMessages[req.lang].passwordLinkSend})
})

/**-----------------------------------
 * @desc get reset password link
 * @route /api/password/reset-password/:userId/:token
 * @method GET
 * @access public
-------------------------------------*/
const getResetPasswordLinkCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(400).json({message: passwordMessages[req.lang].invalidLink})
  }
  const verificationToken = await VerificationToken.findOne({
    userId: user._id,
    token: req.params.token
  });
  if (!verificationToken) {
    return res.status(400).json({message: passwordMessages[req.lang].invalidLink});
  }
  res.status(200).json({message: passwordMessages[req.lang].validUrl});
})

/**-----------------------------------
 * @desc reset password
 * @route /api/password/reset-password/:userId/:token
 * @method POST
 * @access public
-------------------------------------*/
const resetPasswordCtrl = asyncHandler(async (req, res) => {
  // validate
  const { error } = validateNewPassword(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message});
  }
  // check if user exists
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({message: passwordMessages[req.lang].invalidLink});
  }
  const verificationToken = await VerificationToken.findOne({
    userId: user._id,
    token: req.params.token
  })
  if (!verificationToken) {
    return res.status(400).json({message: passwordMessages[req.lang].invalidLink})
  }
  if (!user.isVerified) {
    user.isVerified = true;
  }
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);
  user.password = hashPassword;
  await user.save();
  await VerificationToken.deleteOne({_id: verificationToken._id});
  res.status(200).json({message: passwordMessages[req.lang].passwordResetSucc})
})

module.exports = {
  sendResetPasswordLinkCtrl,
  getResetPasswordLinkCtrl,
  resetPasswordCtrl
}