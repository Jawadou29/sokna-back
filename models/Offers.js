const mongoose = require("mongoose");


const OffersSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }
})



const Offers = mongoose.model("Offer", OffersSchema);


module.exports = {
  Offers
};