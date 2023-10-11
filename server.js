const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = 4000; // set the local port you want to use
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
