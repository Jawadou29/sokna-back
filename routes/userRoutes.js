const {
  getAllUsersCtrl,
  getUserProfileCtrl,
  updateUserProfileCtrl,
  updatePasswordCtrl,
  updateProfieImgCtrl,
  deleteUserProfileCtrl,
  getUsersCount,
  addToSavedProperty,
  unsavePropertyCtrl,
  getSavedProperties,
} = require("../controllers/userController");
const uploadImage = require("../middlewares/uploadImage");
const validateObjectId = require("../middlewares/validateObjectId");
const {
  verifyTokenAndAdmin,
  verifyToken,
  verifyTokenAndUser,
  verifyTokenAndUserOrAdmin,
} = require("../middlewares/verifyToken");
const router = require("express").Router();

// /api/users/profile
router.get("/profile", verifyTokenAndAdmin, getAllUsersCtrl);

// /api/users/profile/count
router.get("/profile/count", verifyTokenAndAdmin, getUsersCount);

// /api/users/profile/:id
// router.get("/profile/:id", validateObjectId, verifyToken, getUserProfileCtrl);
router.get("/profile/:id", validateObjectId,  getUserProfileCtrl);
router.put(
  "/profile/:id",
  validateObjectId,
  verifyTokenAndUser,
  updateUserProfileCtrl
);
router.delete(
  "/profile/:id",
  validateObjectId,
  verifyTokenAndUserOrAdmin,
  deleteUserProfileCtrl
);

// /api/users/update-password/:id
router.put(
  "/profile/update-password/:id",
  validateObjectId,
  verifyTokenAndUser,
  updatePasswordCtrl
);

// /api/users/profile-image/:id
router.put(
  "/profile/profile-image/:id",
  validateObjectId,
  verifyTokenAndUser,
  uploadImage.single("image"),
  updateProfieImgCtrl
);

// /api/users/:id/saved
router.post(
  "/:id/saved",
  validateObjectId,
  verifyToken,
  addToSavedProperty
)

// /api/users/:id/saved
router.delete(
  "/:id/saved/:propertyId",
  validateObjectId,
  verifyToken,
  unsavePropertyCtrl
)

// /api/users/:id/saved
router.get(
  "/:id/saved/",
  validateObjectId,
  verifyToken,
  getSavedProperties
)

// /api/users/:id/saved


module.exports = router;
