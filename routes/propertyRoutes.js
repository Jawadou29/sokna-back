const { addNewPropertyCtrl,
        getAllPropertiesCtrl,
        getPropertyByIdCtrl,
        deletePropertyCtrl,
        addRatingCtrl,
        propertiesContCtrl,
        getPropertyRoomsImages,
        updatePropertyLocatinoCtrl,
        updatePropertyDetailsCtrl,
        updateMainImagesCtrl,
        updateOffersCtrl,
        updateNearbyPlacesCtrl,
        updateRoomsAndImagesCtrl,
        updateRoomsImagesCtrl,
        updatePropertyPriceCtrl } = require("../controllers/propertyController");
const uploadImage = require("../middlewares/uploadImage");
const validateObjectId = require("../middlewares/validateObjectId");
const { verifyToken, verifyTokenAndAdmin } = require("../middlewares/verifyToken");

const router = require("express").Router();


// api/properties
router.post("/", verifyToken, uploadImage.any() ,addNewPropertyCtrl)
router.get("/", getAllPropertiesCtrl);

// api/properties/count
router.get("/count", verifyTokenAndAdmin, propertiesContCtrl);

// api/properties/:id
router.get("/:id", validateObjectId, getPropertyByIdCtrl);
// router.get("/:id", validateObjectId, verifyToken, getPropertyByIdCtrl);
router.put("/:id/location", validateObjectId, verifyToken, updatePropertyLocatinoCtrl);
router.put("/:id/details", validateObjectId, verifyToken, updatePropertyDetailsCtrl);
router.put("/:id/mainImages", validateObjectId, verifyToken, uploadImage.any(), updateMainImagesCtrl);
router.put("/:id/offers", validateObjectId, verifyToken, updateOffersCtrl);
router.put("/:id/nearby", validateObjectId, verifyToken, updateNearbyPlacesCtrl);
router.put("/:id/rooms", validateObjectId, verifyToken, uploadImage.any(), updateRoomsAndImagesCtrl);
router.put("/:id/rooms-images", validateObjectId, verifyToken, uploadImage.any(), updateRoomsImagesCtrl);
router.put("/:id/price", validateObjectId, verifyToken, updatePropertyPriceCtrl);
router.delete("/:id", validateObjectId, verifyToken, deletePropertyCtrl);
router.get("/:id/images", validateObjectId, getPropertyRoomsImages);
// api/properties/rate/:id
router.post("/rate/:id", validateObjectId, verifyToken, addRatingCtrl);


module.exports = router;