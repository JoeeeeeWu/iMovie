var Movie = require("../models/movie");
var User = require("../models/user");
var Comment = require("../models/comment");

var signinRequired = function (req, res, next) {
  var user = req.session.user;
  if (!user) {
    return res.redirect("/signin");
  }
  next();
};

module.exports = function (app) {
  app.get("/", function (req, res) {
    Movie.fetch(function (err, movies) {
      if (err) {
        console.log(err);
      }
      res.render("index", {
        title: "iMovie 首页",
        movies: movies,
      });
    });
  });

  app.get("/movie/:id", function (req, res) {
    var id = req.params.id;
    Movie.findById(id, function (err, movie) {
      Comment.find({movie: id})
        .populate("from", "name")
        .exec(function (err, comments) {
          res.render("detail", {
            title: "iMovie " + movie.title,
            movie: movie,
            comments: comments,
          });
        });
    });
  });

  app.post("/user/signup", function (req, res) {
    var _user = req.body.user;
    User.find({ name: _user.name }, function (err, user) {
      if (err) {
        console.log(err);
      }
      if (user.length) {
        return res.redirect("/signin");
      } else {
        console.log("haha");
        var user = new User(_user);
        user.save(function (err, user) {
          if (err) {
            console.log(err);
          } else {
            res.redirect("/");
            console.log(user);
          }
        });
      }
    })
  });

  app.post("/user/signin", function (req, res) {
    var _user = req.body.user;
    var name = _user.name;
    var password = _user.password;
    User.findOne({ name: name }, function (err, user) {
      if (err) {
        console.log(err);
      }
      if (!user) {
        return res.redirect("/signup");
      }
      user.comparePassword(password, function (err, isMatch) {
        if (err) {
          console.log(err);
        }
        if (isMatch) {
          console.log("password is matched");
          req.session.user = user;
          return res.redirect("/");
        } else {
          return res.redirect("/signin");
          console.log("password is not matched");
        }
      });
    });
  });

  app.get("/logout", function (req, res) {
    delete req.session.user;
    res.redirect("/");
  });

  app.get("/signup", function (req, res) {
    res.render("signup", {
      title: "iMovie 注册页面",
    });
  });

  app.get("/signin", function (req, res) {
    res.render("signin", {
      title: "iMovie 登录页面",
    });
  });

  app.post("/user/comment", signinRequired, function (req, res) {
    var _comment = req.body.comment;
    var movieId = _comment.movie;
    var comment = new Comment(_comment);
    comment.save(function (err, comment) {
      if (err) {
        console.log(err);
      }
      res.redirect("/movie/" + movieId);
    });
  });
};
