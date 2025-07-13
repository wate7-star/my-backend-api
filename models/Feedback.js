const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
  course: String,
  lecturer: String,
  rating: String,
  message: String,
  approved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
