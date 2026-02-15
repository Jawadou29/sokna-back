const asyncHandler = require("express-async-handler");
const { User, validateUpdateUser, validateUpdatePassword, validateSavaedProperty } = require("../models/User");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const { cloudinaryUploadImage, cloudinaryDeleteImage, cloudinaryDeleteMany } = require("../utils/cloudinary");
const { Property } = require("../models/Property");
const { Comment } = require("../models/Comment");
const { userMessages } = require("../translations/user");

/**
 * @desc get all users
 * @route /api/users/profile
 * @method GET
 * @access private (only admin)
*/
const getAllUsersCtrl = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.status(200).json(users);
})


/**
 * @desc get user by id
 * @route /api/users/profile/:id
 * @method GET
 * @access private (loged in user) 
*/
const getUserProfileCtrl = asyncHandler(async (req, res) => {
  console.log("heeeeeeeeeeeeeerrrrrrrrreeeeeeeeeee")
  const user = await User.findById(req.params.id)
                          .populate({
                            path: "Properties",
                            select: "city title address price serviceType propertyType mainImages rate Comments",
                            populate: {
                              path: "Comments"
                            }
                          })
                          .select("-password");
  if (!user) {
    return res.status(404).json({message: userMessages[req.lang].userNotFound})
  }
  res.status(200).json(user);
})

/**
 * @desc update user info
 * @route /api/users/profile/:id
 * @method PUT
 * @access private (only user himself)
*/
const updateUserProfileCtrl = asyncHandler(async (req, res) => {
  // validate user
  const { error } = validateUpdateUser(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message});
  }

  // build update object
  const updateFields = {};
  if (req.body.firstName) updateFields.firstName = req.body.firstName;
  if (req.body.lastName) updateFields.lastName = req.body.lastName;

  // handle contact
  if (req.body.contact) {
    if ('phoneNumber' in req.body.contact) {
      updateFields['contact.phoneNumber'] = req.body.contact.phoneNumber; // can be ""
    }
    if ('email' in req.body.contact) {
      updateFields['contact.email'] = req.body.contact.email; // can be ""
    }
  }

  // update user
  // const {firstName, lastName, phoneNumber} = req.body;
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { $set: updateFields },
    {new: true}
  )
    .select("-password").
    populate("Properties", "city title images rate");


  res.status(200).json({
    message: userMessages[req.lang].infoUpdated,
    updatedUser
  });
})

/**
 * @desc update password
 * @route /api/users/profile/update-password/:id
 * @method PUT
 * @access private (only user himself)
*/
const updatePasswordCtrl = asyncHandler(async (req, res) => {
  // validate update password
  const { error } = validateUpdatePassword(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message});
  }
  // check if the old password is correct
  let user = await User.findById(req.params.id);
  const isCurrentPasswordCorrect = await bcrypt.compare(req.body.currentPassword, user.password);
  // check the old password is correct
  if (!isCurrentPasswordCorrect) {
    return res.status(400).json({message: userMessages[req.lang].passwordNotCorrect});
  }
  // hash the new password
  const salt = await bcrypt.genSalt(10);
  req.body.newPassword = await bcrypt.hash(req.body.newPassword, salt);
  await User.findByIdAndUpdate(req.params.id, {
    $set: {
      password: req.body.newPassword,
    }
  })
  res.status(200).json({message: userMessages[req.body].passwordUpdated})
})


/**
 * @desc update profile image
 * @route /api/users/profile/profile-image/:id
 * @method PUT
 * @access private (only user him self)
*/
const updateProfieImgCtrl = asyncHandler(async (req, res) => {
  // validate image
  if (!req.file) {
    return res.status(400).json({message: userMessages[req.lang].noImgProvided})
  }
  // get path of the image
  const imgPath = path.join(__dirname, `../images/${req.file.filename}`);
  // upload to cloudinary
  const result = await cloudinaryUploadImage(imgPath);

  // get the user from db
  const user = await User.findById(req.user.id);
  // delete old image
  if (user.photoProfile.publicId) {
    await cloudinaryDeleteImage(user.photoProfile.publicId);
  }
  // update new image
  user.photoProfile = {
    url: result.secure_url,
    publicId: result.public_id
  };
  await user.save();
  res.status(200).json({
    message: userMessages[req.lang].photoUploaded,
    photoProfile: {url: result.secure_url, publicId: result.public_id}
  });
  // remove image from the server
  fs.unlinkSync(imgPath);
})



/**
 * @desc delete user
 * @route /api/users/profile/:id
 * @method DELETE
 * @access private (only user and admin)
*/
const deleteUserProfileCtrl = asyncHandler(async (req, res) => {
  // check if the user exists
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({message: userMessages[req.lang].useNotFound});
  }
  // get all Properties
  const properties = await Property.find({owner: user._id});
  // get all public ids
  // const images = properties?.map((p) => p.images);
  const allPublicIds = properties.flatMap(p => {
    const mainIds = p.mainImages?.map(img => img.publicId) || [];
    const roomIds = p.roomsImages?.flatMap(r => r.images?.map(img => img.publicId) || []) || [];
    return [...mainIds, ...roomIds];
  })
  // delete images from cloudinary
  if (allPublicIds?.length > 0) {
    await cloudinaryDeleteMany(allPublicIds);
  }
  // delete profile picture
  if (user.photoProfile?.publicId) {
    await cloudinaryDeleteImage(user.photoProfile.publicId);
  }
  // delete properties and comments
  await Property.deleteMany({owner: user._id})
  await Comment.deleteMany({user: user._id});
  // delete user himself
  await User.findByIdAndDelete(req.params.id);
  // send response
  res.status(200).json({message: userMessages[req.lang].accountDeleted});
})


/**
 * @desc get count of users
 * @route /api/users/count
 * @method GET
 * @access private (admin)
*/
const getUsersCount = asyncHandler(async (req, res) => {
  const count = await User.countDocuments();
  res.status(200).json(count);
})

/**
 * @desc add property to saved
 * @route /api/users/:id/saved
 * @method POST
 * @access private (only user)
*/
const addToSavedProperty = asyncHandler(async (req, res) => {
  // validate data
  const { error } = validateSavaedProperty(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message});
  }
  // check if property exists
  const property = await Property.findById(req.body.propertyId);
  if (!property) {
    return res.status(404).json({message: userMessages[req.lang].propertyNotFound})
  }

  // add to saved if not exists
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    {$addToSet: {saved: req.body.propertyId}}, // add only if not already there
    {new: true}
  )
  res.status(200).json({
    message: userMessages[req.lang].propertySaved,
    updatedUser
  })
})

/**
 * @desc remove from saved properties
 * @route /api/users/:id/saved
 * @method DELETE
 * @access private (logged in user)
*/
const unsavePropertyCtrl = asyncHandler(async (req, res) => {
  const {id, propertyId} = req.params;

  // check if property exists
  const property = await Property.findById(propertyId);
  if (!property) {
    return res.status(404).json({message: userMessages[req.lang].propertyNotFound})
  }
  // unsave property
  const updatedUser = await User.findByIdAndUpdate(
    id,
    {$pull: {saved: propertyId}},
    {new: true}
  )
  res.status(200).json({
    message: userMessages[req.lang].propertyUnsaved,
    updatedUser
  })
})

/**
 * @desc get all saved properties
 * @route /api/users/:id/saved
 * @method GET
 * @access private (logged in user)
*/
const getSavedProperties = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate({
    path: "saved",
    select: "city title serviceType propertyType mainImages price"
  });
  if (!user) {
    return res.status(404).json({message: userMessages[req.lang].useNotFound});
  }
  res.status(200).json(user.saved)
})


module.exports = {
  getAllUsersCtrl,
  getUserProfileCtrl,
  updateUserProfileCtrl,
  deleteUserProfileCtrl,
  getUsersCount,
  updatePasswordCtrl,
  updateProfieImgCtrl,
  addToSavedProperty,
  unsavePropertyCtrl,
  getSavedProperties
}