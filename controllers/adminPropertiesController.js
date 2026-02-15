const asyncHandler = require("express-async-handler");
const { Property } = require("../models/Property");

const getAdminPropertiesCtrl = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    minPrice,
    maxPrice,
    city,
    serviceType,
    propertyType,
    date,
    search
  } = req.query;

  const query = {};

  // search by title or id
  if (search) {
    query.$or = [
      {title: {$regex: search, $options: "i"}},
      {_id: search}
    ]
  }

  // price filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  // city
  if (city) query.city = city;

  // service type
  if (serviceType) query.serviceType = serviceType;

  // Property type
  if (propertyType) query.propertyType = propertyType;

  // date published
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query.createdAt ={$gte: start, $lte: end};
  }
  // pagination
  const skip = (page - 1) * limit;


  const [properties, total] = await Promise.all([
    Property.find(query)
            .sort({createdAt: -1})
            .skip(skip)
            .limit(Number(limit))
            .populate("owner"),
    Property.countDocuments(query)
  ]);

  res.status(200).json({
    properties,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  })
  
});

module.exports = {
  getAdminPropertiesCtrl
}
