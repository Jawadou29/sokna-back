const asyncHandler = require("express-async-handler");
const { validatePropertyInfo, Property, validateUpdatePropertyInfo, validateRating, validateUpdateLocationAndCity, validateUpdateDetails, validateUpdateOffers, validateUpdateNearbyPlaces, validateUpdateRooms, validateUpdateRoomsImages, validatePropertyPrice } = require("../models/Property");
const deleteFiles = require("../utils/deleteImgs");
const { cloudinaryDeleteMany, cloudinaryUploadImage } = require("../utils/cloudinary");
const path = require("path");
const { Comment } = require("../models/Comment");
const { groupFilesByField, uploadFilesToCloudinary } = require("../utils/helpers");

/**
 * @desc add new Property
 * @route /api/properties/add-property
 * @method POST
 * @access private (only loged in user)
*/
const addNewPropertyCtrl = asyncHandler(async (req, res) => {
  try {
    req.body.location = JSON.parse(req.body.location || '{}');
    req.body.offers = JSON.parse(req.body.offers || '[]');
    req.body.nearbyPlaces = JSON.parse(req.body.nearbyPlaces || '[]');
    req.body.rooms = JSON.parse(req.body.rooms || '[]');
    req.body.roomsImages = JSON.parse(req.body.roomsImages || '[]');
    // here
    let price = req.body.price.trim();
    if (price.startsWith("{") && price.endsWith("}")) {
      req.body.price = JSON.parse(price)
    }
    else {
      req.body.price = Number(price)
    }
    
    if (!Array.isArray(req.body.roomsImages)) {
      throw new Error('roomsImages must be an array');
    }

    // 2. Group files by field name
    const filesByField = groupFilesByField(req.files);


    // 3. Validate property info (title, price, etc.)
    const { error } = validatePropertyInfo(req.body);
    if (error) {
      deleteFiles(req.files);
      return res.status(400).json({ message: error.details[0].message });
    }
    // 4. Handle mainImages (require exactly 5)
    const mainFiles = filesByField.mainImages || [];
    if (mainFiles.length !== 5) {
      deleteFiles(req.files);
      return res.status(400).json({ message: 'You must upload exactly 5 main images.' });
    }
    const mainImages = await uploadFilesToCloudinary(mainFiles);

    // 5. Handle roomsImages uploads
    const formattedRoomsImages = [];
    for (let i = 0; i < req.body.roomsImages.length; i++) {
      const roomMeta = req.body.roomsImages[i];
      const candidates = [
        `roomsImages[${i}].images`,
        `roomsImages.${i}.images`,
        `roomsImages[${i}]`,
        `roomsImages.${i}`,
      ];
      const key = Object.keys(filesByField).find(k => candidates.includes(k));
      const roomFiles = key ? filesByField[key] : [];

      if (!roomFiles.length) {
        deleteFiles(req.files);
        return res.status(400).json({ message: `No images uploaded for room index ${i}` });
      }

      const uploaded = await uploadFilesToCloudinary(roomFiles);
      formattedRoomsImages.push({
        room: roomMeta.room || `room-${i}`,
        images: uploaded,
      });
    }
    // 6. Save property
    const property = new Property({
      city: req.body.city,
      location: req.body.location,
      title: req.body.title,
      serviceType: req.body.serviceType,
      address: req.body.address,
      propertyType: req.body.propertyType,
      description: req.body.description,
      maxAdults: req.body.maxAdults,
      maxChilds: req.body.maxChilds,
      offers: req.body.offers,
      rooms: req.body.rooms,
      nearbyPlaces: req.body.nearbyPlaces,
      owner: req.user.id,
      price: req.body.price,
      deposite: req.body.deposite,
      roomsImages: formattedRoomsImages,
      mainImages,
    });

    const savedProperty = await property.save();
    res.status(201).json({
      message: "Your property has been added successfully",
      id: savedProperty._id,
    });

  } catch (error) {
    deleteFiles(req.files);
    res.status(400).json({ message: error.message || 'Invalid request' });
  }
})


/**
 * @desc get all properties depends on the city and the type of service
 * @route /api/properties
 * @method GET
 * @access public
*/
const getAllPropertiesCtrl = asyncHandler(async (req, res) => {
  const {city, serviceType, pageNumber = 1, minPrice, maxPrice, propertyType, rooms} = req.query;
  const PROPERTY_PER_PAGE = 20;
  if (!city || !serviceType) {
    return res.status(400).json({message: "City and type are required."})
  }

  // Ensure pageNumber is a valid number
  const page = parseInt(pageNumber, 10) > 0 ? parseInt(pageNumber, 10) : 1;


  const query = {city, serviceType};

  if (minPrice !== "null" || maxPrice !== "null") {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (propertyType !== "null") {
    query.propertyType = propertyType;
  }

  if (rooms !== "null") {
    query["rooms.total"] = Number(rooms);
  }


  // total number of properties
  const totalProperties = await Property.countDocuments({city, serviceType});

  // fetch properties
  let properties = await Property.find(query)
                                .populate("owner", ["-password"])
                                .populate({
                                  path: "Comments",
                                  populate: {
                                    path: "user",
                                    select: "-password -__v"
                                  }
                                })
                                .skip((page - 1) * PROPERTY_PER_PAGE)
                                .limit(PROPERTY_PER_PAGE)
  res.status(200).json({
    properties,
    currentPage: page,
    totalPages: Math.ceil(totalProperties / PROPERTY_PER_PAGE),
    totalProperties
  })
});


/**
 * @desc get property by ID
 * @route /api/properties/:id
 * @method GET
 * @access public
*/
const getPropertyByIdCtrl = asyncHandler(async (req, res) => {
  const property = await Property.findOne({_id: req.params.id})
                                .select("-roomsImages")
                                .populate("owner", ["-password"])
                                .populate({
                                  path: "Comments",
                                  populate: {
                                    path: "user",
                                    select: "-password -__v"
                                  }
                                })
                                .populate("offers")
                                .populate("nearbyPlaces")
                                .populate({
                                  path: "rooms._id",
                                  model: "Room",
                                })
  if (!property) {
    return res.status(404).json({ 
      message: "Property with the given ID not found",
      id: req.params.id
    });
  }
  res.status(200).json(property);
})


/**
 * @desc get property rooms images
 * @route /api/properties/:id/images
 * @method get
 * @access public 
*/
const getPropertyRoomsImages = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).select("roomsImages").populate({
                                  path: "roomsImages.room",
                                  model: "Room"
                                });;
  if (!property) {
    return res.status(404).json({
      message: "Property with the given ID not found",
      id: req.params.id
    })
  }
  res.status(200).json(property.roomsImages);
})

/**
 * @desc update property location by id
 * @route /api/properties/:id/location
 * @method PUT
 * @access private (only user)
*/
const updatePropertyLocatinoCtrl = asyncHandler(async (req, res) => {
  const { error } = validateUpdateLocationAndCity(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message})
  }
  // check if property exists
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({message: "Property not Found"});
  }
  // check if property belong to user
  if (req.user.id !== property.owner.toString()) {
    return res.status(403).json({message: "You are not allowed to change info"})
  }
  // update Property
  const updatedProperty = await Property.findByIdAndUpdate(req.params.id, {
    $set: {
      city: req.body.city,
      location: req.body.location
    }
  }, {new: true}).select("-roomsImages")
                  .populate("owner", ["-password"])
                  .populate({
                    path: "Comments",
                    populate: {
                      path: "user",
                      select: "-password -__v"
                    }
                  })
                  .populate("offers")
                  .populate("nearbyPlaces")
                  .populate({
                    path: "rooms._id",
                    model: "Room",
                  });
  res.status(200).json({
    message: "Location has been updated successfully",
    updatedProperty
  });
})

/**
 * @desc update property details by id
 * @route /api/properties/:id/details
 * @method PUT
 * @access private (only user)
*/
const updatePropertyDetailsCtrl = asyncHandler(async (req, res) => {
  // validate details
  const { error } = validateUpdateDetails(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message});
  }
  // check if property exists
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({message: "Property not Found"})
  }
  // check if property belong to user
  if (req.user.id !== property.owner.toString()) {
    return res.status(403).json({message: "You are not allowed to change info"})
  }
  // update property
  const updatedProperty = await Property.findByIdAndUpdate(req.params.id, {
    $set: {
      title: req.body.title,
      description: req.body.description,
      serviceType: req.body.serviceType,
      propertyType: req.body.propertyType,
      address: req.body.address,
      maxAdults: req.body.maxAdults,
      maxChilds: req.body.maxChilds,
      price: req.body.price,
    }
  }, {new: true}).select("-roomsImages")
                  .populate("owner", ["-password"])
                  .populate({
                    path: "Comments",
                    populate: {
                      path: "user",
                      select: "-password -__v"
                    }
                  })
                  .populate("offers")
                  .populate("nearbyPlaces")
                  .populate({
                    path: "rooms._id",
                    model: "Room",
                  });
  res.status(200).json({message: "Details has been updated successfully", updatedProperty});
})

/**
 * @desc update property main Images by id
 * @route /api/properties/:id/images
 * @method PUT
 * @access private (only user)
*/
const updateMainImagesCtrl = asyncHandler(async (req, res) => {
  if (!req.files) {
    return res.status(400).json({message: "images not exists"});
  }
  if (req.files.length !== 5) {
    deleteFiles(req.files);
    return res.status(400).json({message: "Please upload 5 images"});
  }
  // check if property exists
  const property = await Property.findById(req.params.id);
  if (!property) {
    deleteFiles(req.files);
    return res.status(404).json({message: "Property not found"});
  }
  // check if property belong to user
  if (req.user.id !== property.owner.toString()) {
    deleteFiles(req.files);
    return res.status(403).json({message: "You are not allowed"});
  }
  // delete old main images
  const oldPublicIds = property.mainImages.map(img => img.publicId);
  if (oldPublicIds?.length > 0) {
    await cloudinaryDeleteMany(oldPublicIds)
  }
  // set new Images
  const mainImages = await uploadFilesToCloudinary(req.files);

  // update property
  const updatedProperty = await Property.findByIdAndUpdate(req.params.id, {
    $set: {
      mainImages: mainImages
    }
  }, {new: true}).select("-roomsImages")
                  .populate("owner", ["-password"])
                  .populate({
                    path: "Comments",
                    populate: {
                      path: "user",
                      select: "-password -__v"
                    }
                  })
                  .populate("offers")
                  .populate("nearbyPlaces")
                  .populate({
                    path: "rooms._id",
                    model: "Room",
                  });
  deleteFiles(req.files);
  res.status(200).json({message: "Main images has been updated successefly", updatedProperty})
})

/**
 * @desc update property offers by id
 * @route /api/properties/:id/offers
 * @method PUT
 * @access private (only user)
*/
const updateOffersCtrl = asyncHandler(async (req, res) => {
  // validate details
  const { error } = validateUpdateOffers(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message});
  }
  // check if property exists
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({message: "Property not Found"})
  }
  // check if property belong to user
  if (req.user.id !== property.owner.toString()) {
    return res.status(403).json({message: "You are not allowed to change info"})
  }
  // update data
  const updatedProperty = await Property.findByIdAndUpdate(req.params.id, {
    $set: {
      offers: req.body.offers
    }
  }, {new: true}).select("-roomsImages")
                  .populate("owner", ["-password"])
                  .populate({
                    path: "Comments",
                    populate: {
                      path: "user",
                      select: "-password -__v"
                    }
                  })
                  .populate("offers")
                  .populate("nearbyPlaces")
                  .populate({
                    path: "rooms._id",
                    model: "Room",
                  });
  res.status(200).json({message: "Offers has been updated successefly", updatedProperty})
})

/**
 * @desc update property offers by id
 * @route /api/properties/:id/offers
 * @method PUT
 * @access private (only user)
*/
const updateNearbyPlacesCtrl = asyncHandler(async (req, res) => {
  // validate details
  const { error } = validateUpdateNearbyPlaces(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message});
  }
  // check if property exists
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({message: "Property not Found"})
  }
  // check if property belong to user
  if (req.user.id !== property.owner.toString()) {
    return res.status(403).json({message: "You are not allowed to change info"})
  }
  // update data
  const updatedProperty = await Property.findByIdAndUpdate(req.params.id, {
    $set: {
      nearbyPlaces: req.body.nearbyPlaces
    }
  }, {new: true}).select("-roomsImages")
                  .populate("owner", ["-password"])
                  .populate({
                    path: "Comments",
                    populate: {
                      path: "user",
                      select: "-password -__v"
                    }
                  })
                  .populate("offers")
                  .populate("nearbyPlaces")
                  .populate({
                    path: "rooms._id",
                    model: "Room",
                  });
  res.status(200).json({message: "Nearby places has been updated successefly", updatedProperty});
})

/**
 * @desc update property rooms and Images by id
 * @route /api/properties/:id/rooms
 * @method PUT
 * @access private (only user)
*/
const updateRoomsAndImagesCtrl = asyncHandler(async (req, res) => {
  req.body.rooms = JSON.parse(req.body.rooms || '[]');
  req.body.roomsImages = JSON.parse(req.body.roomsImages || '[]');

  // check if files exists
  if (!req.files || !req.files.length) {
    return res.status(400).json({message: "Missing images"});
  }
  // validate data
  const { error } = validateUpdateRooms(req.body);
  if (error) {
    deleteFiles(req.files)
    return res.status(400).json({message: error.details[0].message});
  }

  // check if property exists
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({message: "Property not Found"})
  }
  // check if property belong to user
  if (req.user.id !== property.owner.toString()) {
    return res.status(403).json({message: "You are not allowed to change info"})
  }

  // Handle roomsImages uploads
    const formattedRoomsImages = [];
    for (let i = 0; i < req.body.roomsImages.length; i++) {
      const roomMeta = req.body.roomsImages[i];
      const candidates = [
        `roomsImages[${i}].images`,
        `roomsImages.${i}.images`,
        `roomsImages[${i}]`,
        `roomsImages.${i}`,
      ];
      
      const roomFiles = req.files.filter(file => candidates.includes(file.fieldname));

      if (!roomFiles.length) {
        deleteFiles(req.files);
        return res.status(400).json({ message: `No images uploaded for room index ${i}` });
      }

      const uploaded = await uploadFilesToCloudinary(roomFiles);
      formattedRoomsImages.push({
        room: roomMeta.room || `room-${i}`,
        images: uploaded,
      });
    }

    // update property
    const updatedProperty = await Property.findByIdAndUpdate(req.params.id, {
      $set: {
        rooms: req.body.rooms,
        roomsImages: formattedRoomsImages,
      }
    }, {new: true}).select("-roomsImages")
                  .populate("owner", ["-password"])
                  .populate({
                    path: "Comments",
                    populate: {
                      path: "user",
                      select: "-password -__v"
                    }
                  })
                  .populate("offers")
                  .populate("nearbyPlaces")
                  .populate({
                    path: "rooms._id",
                    model: "Room",
                  });
    deleteFiles(req.files);
    res.status(200).json({message: "Property rooms updated successefly", updatedProperty});
})

/**
 * @desc update property images by id
 * @route /api/properties/:id/rooms-images
 * @method PUT
 * @access private (only user)
*/
const updateRoomsImagesCtrl = asyncHandler(async (req, res) => {
  req.body.roomsImages = JSON.parse(req.body.roomsImages || '[]');

  // check if files exists
  if (!req.files || !req.files.length) {
    return res.status(400).json({message: "Missing images"});
  }
  // validate data
  const { error } = validateUpdateRoomsImages(req.body);
  if (error) {
    deleteFiles(req.files)
    return res.status(400).json({message: error.details[0].message});
  }
  // check if property exists
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({message: "Property not Found"})
  }
  // check if property belong to user
  if (req.user.id !== property.owner.toString()) {
    return res.status(403).json({message: "You are not allowed to change info"})
  }

  // Handle roomsImages uploads
    const formattedRoomsImages = [];
    for (let i = 0; i < req.body.roomsImages.length; i++) {
      const roomMeta = req.body.roomsImages[i];
      const candidates = [
        `roomsImages[${i}].images`,
        `roomsImages.${i}.images`,
        `roomsImages[${i}]`,
        `roomsImages.${i}`,
      ];
      
      const roomFiles = req.files.filter(file => candidates.includes(file.fieldname));

      if (!roomFiles.length) {
        deleteFiles(req.files);
        return res.status(400).json({ message: `No images uploaded for room index ${i}` });
      }

      const uploaded = await uploadFilesToCloudinary(roomFiles);
      formattedRoomsImages.push({
        room: roomMeta.room || `room-${i}`,
        images: uploaded,
      });
    }
    // update only images
    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: { roomsImages: formattedRoomsImages } },
      { new: true }
    ).select("-roomsImages")
                  .populate("owner", ["-password"])
                  .populate({
                    path: "Comments",
                    populate: {
                      path: "user",
                      select: "-password -__v"
                    }
                  })
                  .populate("offers")
                  .populate("nearbyPlaces")
                  .populate({
                    path: "rooms._id",
                    model: "Room",
                  });
    deleteFiles(req.files);
    res.status(200).json({message: "Rooms Images updated successefly", updatedProperty});
})

/**
 * @desc update property price
 * @route /api/properties/:id/price
 * @method PUT
 * @access private (only user)
*/
const updatePropertyPriceCtrl = asyncHandler(async (req, res) => {
  // validate details
  const { error } = validatePropertyPrice(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message});
  }
  // check if property exists
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({message: "Property not Found"})
  }
  // check if property belong to user
  if (req.user.id !== property.owner.toString()) {
    return res.status(403).json({message: "You are not allowed to change info"})
  }
  // update property
  const updatedProperty = await Property.findByIdAndUpdate(req.params.id, {
    $set: {
      price: req.body.price,
    }
  }, {new: true}).select("-roomsImages")
                  .populate("owner", ["-password"])
                  .populate({
                    path: "Comments",
                    populate: {
                      path: "user",
                      select: "-password -__v"
                    }
                  })
                  .populate("offers")
                  .populate("nearbyPlaces")
                  .populate({
                    path: "rooms._id",
                    model: "Room",
                  });
  res.status(200).json({message: "Details has been updated successfully", updatedProperty});
})

/**
 * @desc delete property by id
 * @route /api/properties/:id
 * @method DELETE
 * @access private (only user)
*/
const deletePropertyCtrl = asyncHandler(async (req, res) => {
  // check if the property exists
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({message: "property not found"});
  }
  // check if the user allowed to delete the property
  if (req.user.role === "admin" || req.user.id === property.owner.toString()) {
    await Property.findByIdAndDelete(req.params.id);
    // get all public images
    const roomsImgs = property.roomsImages?.flatMap(r => r.images);
    let allImages = [...property.mainImages, ... roomsImgs];
    // remove main images from cloudinary
    if (allImages?.length > 0) {
      await cloudinaryDeleteMany(allImages);
    }
    // remove comments
    await Comment.deleteMany({propertyId: property._id});
    res.status(200).json({
      message: "property has been deleted",
      propertyId: property._id,
    })
  }
  else{
    res.status(403).json({message: "access denied"});
  }

})

/**
 * @desc add rating 
 * @route /api/properties/rate
 * @method POST
 * @access private (only logged in user)
*/
const addRatingCtrl = asyncHandler(async (req, res) => {
  // logged in user
  const loggedInUser = req.user.id;
  // the property
  const propertyId = req.params.id;
  // rating user send
  const { rating } = req.body;
  // validate the rating
  const { error } = validateRating(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message});
  }

  // check if the property exists
  let property = await Property.findById(propertyId);
  if (!property) {
    return res.status(404).json({message: "property not found"});
  }

  // check if the user already rate the property
  const isPropertyAlreadyRated = property.rate.find((p) => p.user.toString() === loggedInUser);
  if (isPropertyAlreadyRated) {
    // update the rate
    isPropertyAlreadyRated.rating = rating;
    await property.save();
    return res.status(200).json({ message: "Rating updated successfully" });
  }
  else{
    // add new rate
    property.rate.push({user: loggedInUser, rating});
    await property.save();
    return res.status(200).json({ message: "Rating added successfully" });
  }
});

/**
 * @desc get properties count
 * @route /api/properties/count
 * @method GET
 * @access private (only Admin)
*/
const propertiesContCtrl = asyncHandler(async (req, res) => {
  const count = await Property.countDocuments();
  res.status(200).json(count);
})



module.exports = {
  addNewPropertyCtrl,
  getAllPropertiesCtrl,
  getPropertyByIdCtrl,
  deletePropertyCtrl,
  addRatingCtrl,
  propertiesContCtrl,
  getPropertyRoomsImages,
  updatePropertyLocatinoCtrl,
  updatePropertyDetailsCtrl,
  updateMainImagesCtrl,
  updateOffersCtrl,
  updateNearbyPlacesCtrl,
  updateRoomsAndImagesCtrl,
  updateRoomsImagesCtrl,
  updatePropertyPriceCtrl
}