const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
// const userSchema = require("./user");
const app = express();
const port = 4000; // set the local port you want to use
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// Define your schema before creating the model
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  workoutIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Workout" }],
  firstname: String,
  lastname: String,
});

// Create the model
const userModel = mongoose.model("User", userSchema, "UsersCollection");

//info to connect to MongoDB

const username = "charlesb32";
const password = "GTnPX7g8bV44xU0p";
const userDatabase = "Users";
const workoutDatabase = "Workouts";

mongoose
  .connect(
    `mongodb+srv://${username}:${password}@firstcluster.sjcxaeq.mongodb.net/${userDatabase}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected 2 database");
  })
  .catch((err) => {
    console.log("Error connecting to database:", err);
  });

app.use(express.json()); // parse JSON data from requests
app.use(cors()); // enable CORS for all routes

// retrieve all documents from the collection
app.get("/db", async (req, res) => {
  try {
    // Use the Mongoose model to retrieve all documents from the collection
    const data = await userModel.find({});
    console.log(data);
    // Return the data as a JSON response
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});
