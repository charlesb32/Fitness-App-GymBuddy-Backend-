const calcMacros = require("./calculateMacros");
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
  planIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Plan" }],
  firstname: String,
  lastname: String,
});

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
const workoutSchema = new mongoose.Schema({
  planName: String,
  days_per_Week: Number,
  workouts: [[String]], // A two-dimensional array for exercise details
});

// Create the model
const userModel = mongoose.model("User", userSchema, "User");
const workoutModel = mongoose.model("Workout", workoutSchema, "Workout");
const planModel = mongoose.model("Plan", planSchema, "Plan");
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

const verifyJWT = (req, res, next) => {
  // console.log(
  //   "HEADERS : " + req.headers["x-access-token"] + "------------------"
  // );
  const tok = req.headers["x-access-token"]?.split(" ")[1];
  if (tok) {
    jwt.verify(tok, secretKey, (err, decoded) => {
      if (err)
        return res.json({
          isLoggedIn: false,
          message: "Failed to Authenticate",
        });
      console.log(decoded);
      req.user = {};
      req.user.id = decoded.id;
      req.user.email = decoded.email;
      req.user.firstname = decoded.firstname;
      req.user.lastname = decoded.lastname;
      next();
    });
  } else {
    res.json({ message: "Incorrect Token Given", isLoggedIn: false });
  }
};

//route to get the user based on JWT
app.get("/getUser", verifyJWT, (req, res) => {
  res.json({ isLoggedIn: true, user: req.user });
});
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
          planIds: [],
        });

        // Save the new user to the database
        await newUser.save();
      } else {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }
    } else {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    // Send a success response to the client
    return res.status(200).json({ message: "User added successfully" });
  } catch (error) {
    // Handle any server-side error
    return res.status(500).json({ message: "Server Error" });
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
              // console.log("FASKLFSJAKLFJAKSL");
              const payload = {
                email: dbUser.email,
                id: dbUser._id,
                firstname: dbUser.firstname,
                lastname: dbUser.lastname,
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
              console.log("HERE");
              return res
                .status(400)
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
app.put("/addPlanToUser", async (req, res) => {
  try {
    const formData = req.body.userData;
    const userId = req.body.currUserId;
    console.log(userId);
    const { age, gender, heightFeet, heightInches, weight, frequency, goal } =
      formData;

    // Convert values to numbers
    formData.age = Number(age);
    formData.heightFeet = Number(heightFeet);
    formData.heightInches = Number(heightInches);
    formData.weight = Number(weight);
    formData.frequency = Number(frequency);

    const diet = calcMacros(formData);
    // console.log(diet);
    workoutModel
      .findOne({ days_per_week: formData.frequency })
      .then(async (workout) => {
        if (workout) {
          // console.log("HERE");
          const wId = workout._id; // The _id field contains the ObjectId of the workout
          const plan = new planModel({
            ...formData, // Spread the formData object
            workoutId: wId,
            dailyCalories: Math.round(diet.dailyCalories),
            dailyCarbs: Math.round(diet.dailyCarbsInGrams),
            dailyFats: Math.round(diet.dailyFatsInGrams),
            dailyProtein: Math.round(diet.dailyProteinInGrams),
          });

          console.log(plan);
          const addedPlan = await plan.save();
          // console.log(addedPlan._id);
          const updatedUser = await userModel.findOneAndUpdate(
            { _id: userId },
            { $push: { planIds: addedPlan._id } },
            { new: true } // Return the updated user document
          );
          // You can now use the workoutId as needed
        } else {
          console.log("No matching workout found for the specified frequency.");
          // Handle the case when no matching workout is found
        }
      })
      .catch((err) => {
        console.error("Error finding workout:", err);
        res.status(500).json({ message: "Server Error" });
      });

    res.status(200).json({ message: "Workout plan assigned successfully" });
  } catch (error) {
    // Handle any server-side error
    res.status(500).json({ message: "Server Error" });
  }
});
