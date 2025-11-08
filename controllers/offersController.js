const asyncHandler = require("express-async-handler");
const { Offers } = require("../models/Offers");


/**
 * @description get all offers
 * @route /api/offers/
 * @method GET
 * @access public
*/
const getAllOffersCtrl = asyncHandler(async (req, res) => {
  const offers = await Offers.find();
  res.status(200).json(offers);
})


module.exports = {
  getAllOffersCtrl
}

