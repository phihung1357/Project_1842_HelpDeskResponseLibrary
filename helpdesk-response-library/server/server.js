const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

require("./api/models/helpdeskModel");
require("./api/models/userModel");

const registerRoutes = require("./api/routes/helpdeskRoutes");
const registerAuthRoutes = require("./api/routes/authRoutes");

const app = express();
const port = process.env.PORT || 3000;
const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/helpdesk_db";

mongoose.Promise = global.Promise;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

registerRoutes(app);
registerAuthRoutes(app);

app.get("/", (req, res) => {
  res.send("Helpdesk Response Library API is running.");
});

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found.",
  });
});

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log(`MongoDB connected at ${mongoUri}`);
    app.listen(port, () => {
      console.log(`Helpdesk API server started on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB.", error);
    process.exit(1);
  });
