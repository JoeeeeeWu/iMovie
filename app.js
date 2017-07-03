var express = require("express");
var path = require("path");
var session = require("express-session");
var mongoose = require("mongoose");
var mongoStore = require("connect-mongo")(session);
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var morgan = require("morgan");
var port = process.env.PORT || 3000;
var app = express();
var dbUrl = "mongodb://localhost:27017/imovie";

mongoose.connect(dbUrl);

app.set("views", "./views/pages");
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  secret: "imovie",
  store: new mongoStore({
    url: dbUrl,
    collection: "sessions",
  }),
  resave: false,
  saveUninitialized: true,
}));

// if ("development" === app.get("env")) {
//   app.set("showStackError", true);
//   app.use(morgan(":method :url :status"));
//   app.locals.pretty = true;
//   mongoose.set("debug", true);
// }

app.locals.moment = require("moment");
require("./routes")(app);
app.listen(port, function () {
  console.log("iMovie started on port " + port);
});
