const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { User, validateRegisterUser, validateLoginUser} = require("../models/User");
const VerificationToken = require("../models/VerificationToken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { authMessages } = require("../translations/auth");


/**
 * @desc register new User
 * @route /api/auth/register
 * @method POST
 * @access public
*/
const registerUserCtrl = asyncHandler(async (req, res) => {
  // validate the data
  const { error } = validateRegisterUser(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message});
  }


  // check if the user exists
  let user = await User.findOne({email: req.body.email});
  if (user) {
    return res.status(400).json({message: authMessages[req.lang].emailExists});
  }

  // hash the password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);

  // save profile
  user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: hashPassword,
  })
  await user.save();
  // sending Email
  const verificationToken = new VerificationToken({
    userId: user._id,
    token: crypto.randomBytes(32).toString("hex")
  })
  await verificationToken.save();
  // making link
  const link = `${process.env.CLIENT_DOMAIN}/users/${user._id}/verify/${verificationToken.token}`;

  // put the link in html template
  const htmlTemple = `
    <div>
      <p>Click the link below to verify your Email</p>
      <a href="${link}">Verify</a>
    </div>
  `;
  // send email
  await sendEmail(user.email, "Verify your Email", htmlTemple);

  res.status(201).json({message: authMessages[req.lang].sendEmail});
})


/**
 * @desc login user
 * @route /api/auth/login
 * @method POST
 * @access public
*/
const loginUserCtrl = asyncHandler(async (req, res) => {
  // validate data
  const { error } = validateLoginUser(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message});
  }
  // check if the user exists or not
  const user = await User.findOne({email: req.body.email});
  if (!user) {
    return res.status(400).json({message: authMessages[req.lang].invalidCredentials});
  }
  // check the password
  const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({message: authMessages[req.lang].invalidCredentials});
  }
  // sending Email
  if (!user.isVerified) {
    let verificationToken = await VerificationToken.findOne({
      userId: user._id,
    })
    if (!verificationToken) {
      verificationToken = new VerificationToken({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex")
      })
      await verificationToken.save();
      const link = `${process.env.CLIENT_DOMAIN}/users/${user._id}/verify/${verificationToken.token}`;
      const htmlTemplate = `
        <div>
          <p>click on link below to verify your email</p>
          <a href="${link}">verify</a>
        </div>
      `;
      await sendEmail(user.email, "verify your Email", htmlTemplate)
    }
    return res.status(400).json({message: authMessages[req.lang].sendEmail});
  }
  // gen token
  const token = user.genrateToken();

  // convert mongoose doc to plain object
  const userObj = user.toObject();
  delete userObj.password;
  userObj.token = token;

  // response
  res.status(200).json(userObj)
})

/**
 * @desc verification user Account
 * @route /api/auth/login
 * @method POST
 * @access public
*/
const verifyUserAccountCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(400).json({message: authMessages[req.lang].invalidLink});
  }
  const verificationToken = await VerificationToken.findOne({
    userId: user._id,
    token: req.params.token
  })
  if (!verificationToken) {
    return res.status(400).json({message: authMessages[req.lang].invalidLink});
  }
  user.isVerified = true;
  await user.save();
  await VerificationToken.deleteOne({_id: verificationToken._id});
  res.status(200).json({message: authMessages[req.lang].accountVerified})
})

module.exports = {
  registerUserCtrl,
  loginUserCtrl,
  verifyUserAccountCtrl
}