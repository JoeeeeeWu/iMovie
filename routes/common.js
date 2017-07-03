module.exports = function (app) {
  app.use(function (req, res, next) {
    console.log(req.session.user);
    var _user = req.session.user;
    app.locals.user = _user;
    next();
  });
}
