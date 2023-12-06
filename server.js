const calcMacros = require("./calculateMacros");
const User = require("./user");
const Workout = require("./workout");
const Plan = require("./plan");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const port = 4000; // set the local port you want to use

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
const secretKey = "YourSecretKey";

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
    console.log("Connected to database");
  })
  .catch((err) => {
    console.log("Error connecting to database:", err);
  });

app.use(express.json()); // parse JSON data from requests
app.use(cors()); // enable CORS for all routes//function that sees if an email already exists for a user

const verifyJWT = (req, res, next) => {
  const tok = req.headers["x-access-token"]?.split(" ")[1]; //gets what is after "Bearer"
  if (tok) {
    jwt.verify(tok, secretKey, (err, decoded) => {
      if (err)
        return res.json({
          isLoggedIn: false,
          message: "Failed to Authenticate",
        });
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
  try {
    const user = await User.findOne({ email: userEmailToCheck });
    return !!user;
  } catch (err) {
    console.log(err);
  }
};

//adds user to database
app.post("/addUser", async (req, res) => {
  try {
    console.log(req.body.userData);
    const user = req.body.userData;
    if (user.password === user.confirmPassword) {
      console.log("passwords match");
      const userExists = await userAlreadyExists(user.email);
      console.log(userExists);
      if (!userExists) {
        encryptedPassword = await bcrypt.hash(user.password, 10);
        const newUser = new User({
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
    return res.status(200).json({ message: "User added successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
});

//route for logging user in
app.post("/login", (req, res) => {
  const userLoggingIn = req.body;
  console.log(userLoggingIn);
  User.findOne({ email: userLoggingIn.email })
    .then((dbUser) => {
      if (!dbUser) {
        return res
          .status(401)
          .json({ message: "Invalid Username or Password" });
      } else {
        bcrypt
          .compare(userLoggingIn.password, dbUser.password)
          .then((isCorrect) => {
            if (isCorrect) {
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
                  console.log("Sending Token");
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
    const userData = await User.find({});
    const workoutData = await Workout.find({});
    res.json({ userData, workoutData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// makes plan and adds that plan to the user
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
    Workout.findOne({ days_per_week: formData.frequency })
      .then(async (workout) => {
        if (workout) {
          const wId = workout._id; // The _id field contains the ObjectId of the workout
          const plan = new Plan({
            ...formData, // Spread the formData object
            workoutId: wId,
            dailyCalories: Math.round(diet.dailyCalories),
            dailyCarbs: Math.round(diet.dailyCarbsInGrams),
            dailyFats: Math.round(diet.dailyFatsInGrams),
            dailyProtein: Math.round(diet.dailyProteinInGrams),
          });

          const addedPlan = await plan.save();
          const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $push: { planIds: addedPlan._id } },
            { new: true } // Return the updated user document
          );
          const activePlanIndex = updatedUser.planIds.length - 1;
          updatedUser.activePlanIndex = activePlanIndex;
          await updatedUser.save();
        } else {
          console.log("No matching workout found for the specified frequency.");
        }
      })
      .catch((err) => {
        console.error("Error finding workout:", err);
        res.status(500).json({ message: "Server Error" });
      });

    res.status(200).json({ message: "Workout plan assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

//get all plans that a user had based on userID
app.get("/getPlans/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ _id: userId });
    const planIds = user.planIds;
    // what populate is doing here: for each plan fetched, also fetch associated workoutId details. This implies a relationship between plans and workouts in the database schema by MongoDB's ObjectId references).
    const plans = await Plan.find({ _id: { $in: planIds } }).populate(
      "workoutId"
    );
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.put("/setActivePlanIndex", async (req, res) => {
  try {
    const userId = req.body.currUserId;
    const index = req.body.index;
    console.log(userId, index);
    // Update the user's activePlanIndex
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { activePlanIndex: Number(index) },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Active plan updated successfully" });
  } catch (error) {
    console.error("Error setting active plan:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/getUserInfo/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ _id: userId });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(404).json({ message: "User not found" });
  }
});

app.delete("/deletePlanById/:planId/:userId", async (req, res) => {
  console.log("HERERERE");
  try {
    const planId = req.params.planId;
    const userId = req.params.userId;
    console.log(planId, userId);
    await Plan.findByIdAndDelete(planId);
    await User.findByIdAndUpdate(userId, { $pull: { planIds: planId } });
  } catch (err) {
    return res.status(404).json({ message: "Plan not found" });
  }
});
