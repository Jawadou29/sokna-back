const mongoose = require("mongoose");


const nearbyPlacesSchema = new mongoose.Schema({
  name: {
    type: String,
    requried: true,
    unique: true,
  }
})


const NearbyPlace = mongoose.model("NearbyPlace", nearbyPlacesSchema);

module.exports = {
  NearbyPlace
}