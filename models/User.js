const mongoose = require("mongoose");
const joi = require("joi");
const jwt = require("jsonwebtoken");
const passwordComplexity = require("joi-password-complexity");
const { ref } = require("process");

const userSchema = new mongoose.Schema({
  photoProfile: {
    type: Object,
    default: {
      url: "https://media.istockphoto.com/id/1393750072/vector/flat-white-icon-man-for-web-design-silhouette-flat-illustration-vector-illustration-stock.jpg?s=612x612&w=0&k=20&c=s9hO4SpyvrDIfELozPpiB_WtzQV9KhoMUP9R9gVohoU=",
      publicId: null
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minLength: 8,
  },
  contact: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: function () {
        return this.email;
      }
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: ""
    }
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  saved: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property"
    }
  ]
}, {
  timestamps: true,
  toJSON: {virtuals: true},
  toObject: {virtuals: true}
});

userSchema.virtual("Properties", {
  ref: "Property",
  foreignField: "owner",
  localField: "_id"
});

// genrate token
userSchema.methods.genrateToken = function () {
  return jwt.sign({id: this._id, role: this.role}, process.env.SECRET_KEY)
}

// model
const User = mongoose.model("User", userSchema);

// validate register user
function validateRegisterUser(obj) {
  const schema = joi.object({
    firstName: joi.string().trim().max(100).required().label("First name"),
    lastName: joi.string().trim().max(100).required().label("last name"),
    email: joi.string().trim().email().lowercase().required(),
    password: joi.string().trim().required().min(8),
  });
  return schema.validate(obj, {abortEarly: false});
}

// validate login user
function validateLoginUser(obj) {
  const schema = joi.object({
    email: joi.string().trim().email().lowercase().required(),
    password: joi.string().trim().min(8).required(),
  });
  return schema.validate(obj);
}

// validate update user
function validateUpdateUser(obj) {
  const schema = joi.object({
    firstName: joi.string().trim().max(100).label("First name"),
    lastName: joi.string().trim().max(100).label("Last name"),
    password: joi.string().trim().min(8),
    contact: joi.object({
      email: joi.string().email().trim().optional().allow(""),
      phoneNumber: joi.string().trim().label("Phone number").optional().allow("")
    })
  });
  return schema.validate(obj);
}

// validate update password
function validateUpdatePassword(obj) {
  const schema = joi.object({
    currentPassword: joi.string().trim().min(8).required().label("current password"),
    newPassword: joi.string().trim().min(8).required()
  });
  return schema.validate(obj);
}

// validate email
function validateEmail(obj) {
  const schema = joi.object({
    email: joi.string().required().trim().min(5).max(100).email()
  })
  return schema.validate(obj);
}

// validate new password
function validateNewPassword(obj) {
  const schema = joi.object({
    password: passwordComplexity().required(),
  })
  return schema.validate(obj);
}

// validate saved property
function validateSavaedProperty(obj) {
  const schema = joi.object({
    propertyId: joi.string().required()
  })
  return schema.validate(obj)
}

module.exports = {
  User,
  validateRegisterUser,
  validateUpdateUser,
  validateLoginUser,
  validateUpdatePassword,
  validateEmail,
  validateNewPassword,
  validateSavaedProperty
}