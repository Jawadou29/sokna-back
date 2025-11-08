const express = require("express");
const connectToDB = require("./config/connectToDB");
const { notFound, errorHandler } = require("./middlewares/error");
const cors = require("cors");
require("dotenv").config();


// init app
const app = express();


app.use(cors({
  origin: "http://localhost:5173",  // Your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


// connect to database
connectToDB();


// middlewares
app.use(express.json());



// routes
app.use("/api/auth/", require("./routes/authRoutes"));
app.use("/api/properties/", require("./routes/propertyRoutes"));
app.use("/api/comments/", require("./routes/commentRoutes"));
app.use("/api/users/", require("./routes/userRoutes"));
app.use("/api/offers/", require("./routes/offersRoutes"));
app.use("/api/rooms/", require("./routes/roomosRoutes"));
app.use("/api/nearby/", require("./routes/nearbyPlacesRoutes"));
app.use("/api/password/", require("./routes/passwordRoutes"));

// error handler
app.use(notFound)
app.use(errorHandler)

// run the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
})