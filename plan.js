//Plan schema
const mongoose = require("mongoose");
const planSchema = new mongoose.Schema({
  age: Number,
  gender: String,
  heightFeet: Number,
  heightInches: Number,
  weight: Number,
  frequency: Number,
  goal: String,
  workoutId: { type: mongoose.Schema.Types.ObjectId, ref: "Workout" },
  dailyCalories: String,
  dailyCarbs: String,
  dailyFats: String,
  dailyProtein: String,
});

module.exports = mongoose.model("Plan", planSchema, "Plan");
