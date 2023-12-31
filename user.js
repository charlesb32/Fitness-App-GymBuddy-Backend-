//User schema
const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  planIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Plan" }],
  firstname: String,
  lastname: String,
  activePlanIndex: Number,
});

module.exports = mongoose.model("User", userSchema, "User");
