const asyncHandler = require("express-async-handler");
const { User } = require("../models/User");
const { Property } = require("../models/Property");
const { Comment } = require("../models/Comment");

/**
 * @desc admin dashboard overview
 * @route /api/admin/dashboard/
 * @method GET
 * @access private (only admin)
*/
const getDashboardOverviewDataCtrl = asyncHandler(async (req, res) => {
  const usersCount = await User.countDocuments();
  const verifiedUsers = await User.countDocuments({isVerified: true});
  const notVerifiedUsers = await User.countDocuments({isVerified: false});
  const propertiesCount = await Property.countDocuments();
  const commentsCount = await Comment.countDocuments();
  const reportsCount = 0; // later

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const userJoinedToday = await User.countDocuments({
    createdAt: {$gte: today}
  });

  const propertiesToday = await Property.countDocuments({
    createdAt: {$gte: today}
  });

  const topCities = await Property.aggregate([
    {
      $group: {
        _id: "$city",
        total: {$sum: 1}
      }
    },
    {
      $sort: {total: -1}
    },
    {
      $limit: 5
    },
    {
      $project: {
        _id: 0,
        city: "$_id",
        total: 1,
      }
    }
  ]);


  const rentDay = await Property.countDocuments({serviceType: "rent by day"});
  const rentMonth = await Property.countDocuments({serviceType: "rent by month"});
  const sell = await Property.countDocuments({serviceType: "sell"});

  // recent users
  const recentUsers = await User.find().sort({createdAt: -1})
                                .limit(2)
                                .select("photoProfile firstName lastName isVerified")

  // recent properties
  const recentProperties = await Property.find().sort({createdAt: -1})
                                          .limit(2)
                                          .select("mainImages owner location title price propertyType createdAt")
                                          .populate("owner", "-password")

  const allPropertiesLocations = await Property.find().select("location mainImages title price");

  res.status(200).json({
    state: {
      users: usersCount,
      verifiedUsers,
      notVerifiedUsers,
      userJoinedToday,
      properties: propertiesCount,
      reports: reportsCount,
      comments: commentsCount
    },
    recent: {
      users: recentUsers,
      properties: recentProperties,
    },
    analytics: {
      propertiesToday,
      topCities,
      rentDay,
      rentMonth,
      sell,
    },
    allPropertiesLocations
  })
})

module.exports = {
  getDashboardOverviewDataCtrl
}