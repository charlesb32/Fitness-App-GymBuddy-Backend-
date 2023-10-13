const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const userSchema = require("./user");
const app = express();
const port = 4000; // set the local port you want to use
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
const secretKey = "YourSecretKey";
// Define your schema before creating the model
const userSchema = new mongoose.Schema({
  // username: String,
  email: String,
  password: String,
  workoutIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Workout" }],
  firstname: String,
  lastname: String,
});

const workoutSchema = new mongoose.Schema({
  planName: String,
  daysPerWeek: Number,
  workouts: [[String]], // A two-dimensional array for exercise details
});

// Create the model
const userModel = mongoose.model("User", userSchema, "User");
const workoutModel = mongoose.model("Workout", workoutSchema, "Workout");
//info to connect to MongoDB

const username = "charlesb32";
const password = "GTnPX7g8bV44xU0p";
const database = "GymBuddyDatabase";

mongoose
  .connect(
    `mongodb+srv://${username}:${password}@firstcluster.sjcxaeq.mongodb.net/${database}?retryWrites=true&w=majority`,
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
app.use(cors()); // enable CORS for all routes//function that sees if an email already exists for a user
const userAlreadyExists = async (userEmailToCheck) => {
  // console.log(userEmailToCheck);
  try {
    const user = await userModel.findOne({ email: userEmailToCheck });
    return !!user;
  } catch (err) {
    console.log(err);
  }
};

//finds a workout plan that matches the number of days per week the person wants to go to the gym
const findWorkoutPlan = async (daysPerWeek) => {
  try {
    const workoutPlan = await workoutModel.findOne({ daysPerWeek });
    return workoutPlan;
  } catch (error) {
    throw error;
  }
};

//gets user workouts by userID
const getUserWorkouts = async (userId) => {
  try {
    // Find the user by their ID
    const user = await userModel.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Retrieve workouts based on the user's workoutIds
    const userWorkouts = await workoutModel.find({
      _id: { $in: user.workoutIds },
    });

    return userWorkouts;
  } catch (error) {
    throw error;
  }
};

//adds user to database
app.post("/addUser", async (req, res) => {
  try {
    console.log(req.body.userData);
    user = req.body.userData;
    if (user.password === user.confirmPassword) {
      console.log("passwords match");
      const userExists = await userAlreadyExists(user.email);
      console.log(userExists);
      if (!userExists) {
        encryptedPassword = await bcrypt.hash(user.password, 10);
        console.log(encryptedPassword);
        const newUser = new userModel({
          email: user.email,
          password: encryptedPassword,
          firstname: user.firstname,
          lastname: user.lastname,
          workoutIds: [],
        });

        // Save the new user to the database
        await newUser.save();
      } else {
        console.log("USER EXISTS ALREADY");
      }
    } else {
      console.log("passwords dont match");
    }
    // Send a success response to the client
    res.status(200).json({ message: "User added successfully" });
  } catch (error) {
    // Handle any server-side error
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/login", (req, res) => {
  const userLoggingIn = req.body;
  console.log(userLoggingIn);
  userModel
    .findOne({ email: userLoggingIn.email })
    .then((dbUser) => {
      if (!dbUser) {
        return res
          .status(401)
          .json({ message: "Invalid Username or Password" });
        // console.log("Invalid Username or Password");
      } else {
        bcrypt
          .compare(userLoggingIn.password, dbUser.password)
          .then((isCorrect) => {
            if (isCorrect) {
              const payload = {
                email: dbUser.email,
                id: dbUser._id,
              };
              jwt.sign(
                payload,
                secretKey,
                { expiresIn: "1d" },
                (err, token) => {
                  if (err) {
                    return res
                      .status(500)
                      .json({ message: "Token generation error" });
                  }
                  return res.status(200).json({
                    message: "Success",
                    token: "Bearer " + token,
                  });
                }
              );
            } else {
              return res
                .status(401)
                .json({ message: "Invalid Username or Password" });
            }
          })
          .catch((error) => {
            return res.status(500).json({ message: "Server error" });
          });
      }
    })
    .catch((error) => {
      return res.status(500).json({ message: "Server error" });
    });
});

// retrieve all documents from the collection
app.get("/db", async (req, res) => {
  try {
    // Use the Mongoose model to retrieve all documents from the collection
    const userData = await userModel.find({});
    const workoutData = await workoutModel.find({});
    console.log(userData);
    // Return the data as a JSON response
    // res.json(userData);
    res.json({ userData, workoutData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/userWorkouts/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const userWorkouts = await getUserWorkouts(userId);

    res.json(userWorkouts);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// In your server.js file
app.put("/addWorkoutToUser", async (req, res) => {
  try {
    console.log(req.params.userData, req.body);
    const { userId } = req.params;
    const { workoutId } = req.body;

    // Update the user's data with the assigned workoutId (example below)
    // Replace this with your actual database update logic
    // userModel.findByIdAndUpdate(userId, { $push: { workoutIds: workoutId } });

    // Send a success response to the client
    res.status(200).json({ message: "Workout plan assigned successfully" });
  } catch (error) {
    // Handle any server-side error
    res.status(500).json({ message: "Server Error" });
  }
});
