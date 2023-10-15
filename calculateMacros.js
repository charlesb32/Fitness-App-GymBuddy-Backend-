const calcMacros = ({
  age,
  gender,
  heightFeet,
  heightInches,
  weight,
  frequency,
  goal,
}) => {
  age = Number(age);
  heightFeet = Number(heightFeet);
  heightInches = Number(heightInches);
  weight = Number(weight);
  frequency = Number(frequency);
  // console.log(age, heightFeet, heightInches, weight, frequency);
  //Calc bmr
  let bmr = 0;
  if (gender === "Male") {
    bmr =
      66.47 +
      6.23 * weight +
      12.22 * (heightFeet * 12 + heightInches) -
      6.8 * age;
  } else if (gender === "Female") {
    bmr =
      655.1 +
      4.35 * weight +
      4.7 * (heightFeet * 12 + heightInches) -
      4.7 * age;
  }

  //adjusting bmr for frequency of excercise
  if (frequency < 1) {
    bmr *= 1.2;
  } else if (frequency < 4) {
    bmr *= 1.375;
  } else if (frequency < 6) {
    bmr *= 1.55;
  } else {
    bmr *= 1.75;
  }

  //adjusting bmr for goal
  if (goal === "Cut") {
    bmr -= 200;
  }
  // else if(goal === 'Maintain'){

  // }
  else if (goal === "Bulk") {
    bmr += 200;
  }

  const carbs = (bmr * 0.45) / 4;
  const protein = (bmr * 0.35) / 4;
  const fats = (bmr * 0.2) / 9;

  console.log({
    dailyCalories: bmr,
    dailyCarbsInGrams: carbs,
    dailyProteinInGrams: protein,
    dailyFatsInGrams: fats,
  });
  return {
    dailyCalories: bmr,
    dailyCarbsInGrams: carbs,
    dailyProteinInGrams: protein,
    dailyFatsInGrams: fats,
  };
};

module.exports = calcMacros;
