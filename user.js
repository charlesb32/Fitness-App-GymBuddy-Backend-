const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  workoutIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Workout" }],
  firstname: String,
  lastname: String,
});

module.exports = mongoose.model("User", userSchema);
