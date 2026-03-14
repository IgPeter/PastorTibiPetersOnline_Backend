const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const path = require("path");
const morgan = require("morgan");
const mongoose = require("mongoose");
const messageRouter = require("./routes/message");
const userRouter = require("./routes/user");
const categoryRouter = require("./routes/category");
const subscriptionRouter = require("./routes/subscription");
const paystackRouter = require("./routes/paystack");
const spreadTheWordRouter = require("./routes/spreadTheWord");
const spreadTheWordRouterWeekTwo = require("./routes/spreadthewordweektwo");
require("dotenv/config");
const errorHandler = require("./helpers/error-handling");
const cors = require("cors");

const api = process.env.API_URL;
const PORT = process.env.PORT;

const webPathWeekOne = path.join(__dirname, "dist-spreadtheword");
const webPathWeekTwo = path.join(__dirname, "dist-spreadthewordweektwo");
const webPathWeekThree = path.join(__dirname, "dist-spreadthewordweekthree");

//middlewares
app.use(morgan("tiny"));
app.use(bodyParser.json());

app.use(cors());
app.options("*", cors());

//app.use(authJwt())
app.use("/public/upload", express.static(__dirname + "/public/upload"));

// serve static assets
app.use("/spreadtheword", express.static(webPathWeekOne));
app.use("/spreadthewordweektwo", express.static(webPathWeekTwo));
app.use("/spreadthewordweekthree", express.static(webPathWeekThree));

// SPA fallback for React routing
app.get("/spreadtheword/*", (req, res) => {
  res.sendFile(path.join(webPathWeekOne, "index.html"));
});

app.get("/spreadthewordweektwo/*", (req, res) => {
  res.sendFile(path.join(webPathWeekTwo, "index.html"));
});

app.get("/spreadthewordweekthree/*", (req, res) => {
  res.sendFile(path.join(webPathWeekTwo, "index.html"));
});

app.use(errorHandler);

app.use(`${api}/message`, messageRouter);
app.use(`${api}/user`, userRouter);
app.use(`${api}/category`, categoryRouter);
app.use(`${api}/subscription`, subscriptionRouter);
app.use(`${api}/paystack`, paystackRouter);
app.use(`${api}/spreadtheword`, spreadTheWordRouter);
app.use(`${api}/spreadthewordweektwo`, spreadTheWordRouterWeekTwo);

//connect to database
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connected to pto_db");
  })
  .catch((err) => {
    console.log(err);
  });

//development
app.listen(PORT, () => {
  console.log(`server running at localhost:${PORT}`);
});

//production
/*var server = app.listen(process.env.PORT || 3000, () => {
    var port = server.address().port; 
    console.log('app running at port', port);
})*/
