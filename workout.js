//Workout schema
const mongoose = require("mongoose");
const workoutSchema = new mongoose.Schema({
  planName: String,
  days_per_Week: Number,
  workouts: [[String]], // A two-dimensional array for exercise details
});

module.exports = mongoose.model("Workout", workoutSchema, "Workout");
