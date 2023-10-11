const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema({
  planName: String,
  daysPerWeek: Number,
  workouts: [[String]], // A two-dimensional array for exercise details
});

module.exports = mongoose.model("Workout", workoutSchema);
