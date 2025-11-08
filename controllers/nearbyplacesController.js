const asyncHandler = require("express-async-handler");
const { NearbyPlace } = require("../models/NearbyPlaces");


/**
 * @description get all nearbyPlaces
 * @route /api/nearbyPlaces
 * @method GET
 * @access public
*/
const getAllNearbyPlaces = asyncHandler(async (req, res) => {
  let places = await NearbyPlace.find();
  res.status(200).json(places);
})


module.exports = {
  getAllNearbyPlaces
};