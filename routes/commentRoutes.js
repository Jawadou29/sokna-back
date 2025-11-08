const { addNewCommentCtrl, updateCommentCtrl, deleteCommentCtrl } = require("../controllers/commentController");
const validateObjectId = require("../middlewares/validateObjectId");
const { verifyToken } = require("../middlewares/verifyToken");

const router = require("express").Router();

// /api/comments
router.post("/", verifyToken, addNewCommentCtrl);
// /api/comments/:id
router.put("/:id", validateObjectId, verifyToken, updateCommentCtrl);
router.delete("/:id", validateObjectId, verifyToken, deleteCommentCtrl);




module.exports = router;