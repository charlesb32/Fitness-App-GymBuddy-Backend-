const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  planIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Plan" }],
  firstname: String,
  lastname: String,
  // activePlanIndex: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Plan",
  //   default: null, // Set a default value of null to indicate that it's initially empty
  // },
  activePlanIndex: Number,
});

module.exports = mongoose.model("User", userSchema, "User");
