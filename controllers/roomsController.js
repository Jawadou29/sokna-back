const asyncHandler = require("express-async-handler");
const { Room } = require("../models/Rooms");

/**
 * @description get all rooms
 * @route /api/rooms
 * @method GET
 * @access public 
*/
const getAllRoomsCtrl = asyncHandler(async (req, res) => {
  const rooms = await Room.find();
  res.status(200).json(rooms);
})



module.exports = {
  getAllRoomsCtrl
}