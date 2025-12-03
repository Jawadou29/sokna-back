const mongoose = require("mongoose");
const joi = require("joi");

const propertySchema = new mongoose.Schema({
  city: {
    type: String,
    required: true
  },
  location: {
    type: {type: String, default: "Point"}, // GeoJSON type
    coordinates: {type: [Number], required: true} // [longitude, latitude]
  },
  title: {
    type: String,
    required: true,
    minLength: 10,
    trim: true
  },
  serviceType: {
    type: String,
    enum: ["rent by month", "rent by day", "sell"],
    required: true
  },
  propertyType: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  maxAdults: {
    type: Number,
    required: true,
    min: 1,
  },
  maxChilds: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minLength: 30
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  offers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
    }
  ],
  rooms: {
    type: [
        {
        _id: false,
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Room",
          required: true,
        },
        count: {
          type: Number,
          required: true,
          min: 1,
        }
      }
    ],
    validate: {
        validator: v => v.length > 0,
        message: "At least one room is required"
      },
    required: true,
  },
  nearbyPlaces: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NearbyPlace",
    }
  ],
  roomsImages: {
    type: [
      {
        room: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Room",
          required: true,
        },
        images: [
          {
            url: {type: String, required: true},
            publicId: {type: String, required: true}
          }
        ]
      }
    ],
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: "At least one room with images is required"
    },
    required: true
  },
  mainImages: [
    {
      url: {type: String, required: true},
      publicId: {type: String, required: true}
    }
  ],
  price: {
    type: Number,
    min: 0,
    required: true,
  },
  deposite: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {virtuals: true},
  toObject: {virtuals: true}
});

// Consider indexing location for geospatial queries
propertySchema.index({ location: "2dsphere" });

// populate comments with property
propertySchema.virtual("Comments", {
  ref: "Comment",
  foreignField: "propertyId",
  localField: "_id"
})



const Property = mongoose.model("Property", propertySchema);

// validate property info
function validatePropertyInfo(obj) {
  const schema = joi.object({
    city: joi.string().required(),
    location: joi.object({
      type: joi.string().valid("Point").required(),
      coordinates: joi.array().items(joi.number()).length(2).required()
    }).required(),
    title: joi.string().trim().min(10).required(),
    description: joi.string().trim().min(30).required(),
    serviceType: joi.string().valid("rent by month", "rent by day", "sell").required(),
    propertyType: joi.string().required().trim(),
    address: joi.string().trim().required(),
    maxAdults: joi.number(),
    maxChilds: joi.number(),
    offers: joi.array().items(joi.string()),
    rooms: joi.array().min(1).required().items(
      joi.object({
        _id: joi.string().required(),
        count: joi.number().min(1)
      })
    ),
    nearbyPlaces: joi.array().items(joi.string()),
    price: joi.number().min(0).required(),
    deposite: joi.number().default(0),
    roomsImages: joi.array().min(1).required(),
  });
  return schema.validate(obj);
}

// validate property location and city
function validateUpdateLocationAndCity(obj) {
  const schema = joi.object({
    city: joi.string(),
    location: joi.object({
      type: joi.string().valid("Point").required(),
      coordinates: joi.array().items(joi.number()).length(2).required()
    }),
  });
  return schema.validate(obj);
}

// validate Property details
function validateUpdateDetails(obj) {
  const schema = joi.object({
    title: joi.string().trim().min(10),
    description: joi.string().trim().min(30),
    serviceType: joi.string().valid("rent by month", "rent by day", "sell"),
    propertyType: joi.string().trim(),
    address: joi.string().trim(),
    maxAdults: joi.number(),
    maxChilds: joi.number(),
    price: joi.number().min(0).required(),
    deposite: joi.number()
  })
  return schema.validate(obj)
}

// validate offers
function validateUpdateOffers(obj) {
  const schema = joi.object({
    offers: joi.array().items(joi.string()),
  })
  return schema.validate(obj);
}

// validate offers
function validateUpdateNearbyPlaces(obj) {
  const schema = joi.object({
    nearbyPlaces: joi.array().items(joi.string()),
  })
  return schema.validate(obj);
}
// validate rooms
function validateUpdateRooms(obj) {
  const schema = joi.object({
    rooms: joi.array().items(
      joi.object({
        _id: joi.string().required(),
        count: joi.number().min(1)
      })
    ).required(),
    roomsImages: joi.array().required()
  })
  return schema.validate(obj)
}
// validate Rooms images
function validateUpdateRoomsImages(obj) {
  const schema = joi.object({
    roomsImages: joi.array().required()
  })
  return schema.validate(obj)
}

// validate property price
function validatePropertyPrice(obj) {
  const schema = joi.object({
    serviceType: joi.string().valid("rent by month", "rent by day", "sell").required(),
    price: joi.number().required().min(0),
    deposite: joi.number().default(0),
  })
  return schema.validate(obj)
}

module.exports = {
  Property,
  validatePropertyInfo,
  validateUpdateLocationAndCity,
  validateUpdateDetails,
  validateUpdateOffers,
  validateUpdateNearbyPlaces,
  validateUpdateRooms,
  validateUpdateRoomsImages,
  validatePropertyPrice
}