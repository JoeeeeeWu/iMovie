module.exports = function (app) {
  require("./common")(app);
  require("./app")(app);
  require("./admin")(app);
}
