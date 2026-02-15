const asyncHandler = require("express-async-handler");
const { User } = require("../models/User");

const getAdminUsersCtrl = asyncHandler(async (req, res) => {
  const {
    page=1,
    limit=20,
    search,
    userType
  } = req.query;
  const query = {};


  if (search) {
    query.$or = [
      {firstName: {$regex: search, $options: "i"}},
      {lastName: {$regex: search, $options: "i"}}
    ]

    if (mongoose.Types.ObjectId.isValid(search)) {
      query.$or.push({ _id: search });
      }
  }
  
  if(userType === "not verified") {
    query.isVerified = false;
  }
  else if (userType === "verified") {
    query.isVerified = true;
  }

  

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
        .select("-password")
        .sort({createdAt: -1})
        .skip(skip)
        .limit(Number(limit)),
    User.countDocuments(query)
  ])
  res.status(200).json({
    users,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit)
  })
})


module.exports = {
  getAdminUsersCtrl
}