const asyncHandler = require("express-async-handler");
const { Comment, validateNewComment, validateUpdateComment } = require("../models/Comment");
const { Property } = require("../models/Property");
const { User } = require("../models/User");

/**
 * @desc add new comment
 * @route /api/comments/
 * @method Post
 * @access private (loged in user)
*/
const addNewCommentCtrl = asyncHandler(async (req, res) => {
  // validate property and text
  const { error } = validateNewComment(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message});
  }
  
  // Fetch user and check property existence concurrently
  const propertyExists = await Property.exists({ _id: req.body.propertyId });
  if (!propertyExists) {
    return res.status(404).json({message: "Property not found"});
  }
  
  const alreadyComment = await Comment.findOne({
    user: req.user.id,
    propertyId: req.body.propertyId,
  })
  
  if (alreadyComment) {
    alreadyComment.text = req.body.text;
    alreadyComment.rate = req.body.rate;
    await alreadyComment.save();
    return res.status(201).json({message: "Your comment has been updated"})
  }
  
  // add comment to db
  const comment = new Comment({
    user: req.user.id,
    propertyId: req.body.propertyId,
    text: req.body.text,
    rate: req.body.rate
  });

  await comment.save();
  // const savedComment = await comment.save();
  // const populatedComment = await savedComment.populate("user", ["photoProfile", "firstName", "lastName", "createdAt"]);


  res.status(201).json({message: "comment added successefuly"});
})


/**
 * @desc update comment
 * @route /api/comments/:id
 * @method PUT
 * @access private (user him self)
*/
const updateCommentCtrl = asyncHandler(async (req, res) => {
  // validate update comment
  const { error } = validateUpdateComment(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message});
  }
  // check if comment exists
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return res.status(404).json({message: "Comment not found"});
  }
  // check the permission
  if (req.user.id !== comment.user.toString()) {
    return res.status(403).json({message: "You are not allowed to change this comment"});
  }
  // update the comment
  const newComment = await Comment.findByIdAndUpdate(req.params.id, {
    $set: {
      text: req.body.text,
    }
  }, {new: true});
  res.status(200).json(newComment);
});

/**
 * @desc delete comment
 * @route /api/comments/:id
 * @method DELETE
 * @access private (admin or user him self)
*/
const deleteCommentCtrl = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return res.status(400).json({message: "comment not found"});
  }
  if (req.user.role === "admin" || req.user.id === comment.user.toString()) {
    await Comment.findByIdAndDelete(req.params.id);
    res.status(201).json({message: "Comment has been deleted"});
  }
  else{
    res.status(400).json({message: "not allowed to delete this message"});
  }
})


module.exports = {
  addNewCommentCtrl,
  updateCommentCtrl,
  deleteCommentCtrl
}