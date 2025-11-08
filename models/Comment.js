const mongoose = require("mongoose");
const joi = require("joi");


const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  text: {
    type: String,
    maxLength: 500,
    trim: true,
  },
  rate: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  }
}, {
  timestamps: true,
});

// model
const Comment = mongoose.model("Comment", commentSchema);

// validate new text
function validateNewComment(obj) {
  const schema = joi.object({
    propertyId: joi.string().required().label("property id"),
    text: joi.string().trim().max(500),
    rate: joi.number().min(0).max(5).required()
  })
  return schema.validate(obj);
}

// validate update text
function validateUpdateComment(obj) {
  const schema = joi.object({
    propertyId: joi.string().label("property id"),
    text: joi.string().trim().max(500),
    rate: joi.number().min(0).max(5).required()
  });
  return schema.validate(obj);
}

module.exports = {
  Comment,
  validateNewComment,
  validateUpdateComment
}
