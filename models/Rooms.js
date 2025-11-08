const mongoose = require("mongoose");


const roomsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }
})


const Room = mongoose.model("Room", roomsSchema);


module.exports = {
  Room
};