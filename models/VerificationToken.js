const mongoose = require("mongoose");

const VerificationTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  token: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
})

const VerificationToken = mongoose.model("verificationToken", VerificationTokenSchema);

module.exports = VerificationToken;