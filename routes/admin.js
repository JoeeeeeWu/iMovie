var Movie = require("../models/movie");
var User = require("../models/user");
var _ = require("underscore");

var signinRequired = function (req, res, next) {
  var user = req.session.user;
  if (!user) {
    return res.redirect("/signin");
  }
  next();
};

var adminRequired = function (req, res, next) {
  var user = req.session.user;
  if (user.role <= 10) {
    return res.redirect("/signin");
  }
  next();
};

module.exports = function (app) {
  app.get("/admin/movie/new", signinRequired, adminRequired, function(req, res) {
    res.render("admin", {
      title: "iMovie 后台录入页",
      movie: {
        title: "",
        director: "",
        country: "",
        language: "",
        year: "",
        poster: "",
        flash: "",
        summary: "",
      },
    });
  });

  app.get("/admin/movie/update/:id", signinRequired, adminRequired, function(req, res) {
    var id = req.params.id;
    if (id) {
      Movie.findById(id, function(err, movie) {
        res.render("admin", {
          title: "iMovie 后台更新页",
          movie: movie,
        });
      });
    }
  });

  app.post("/admin/movie/new", signinRequired, adminRequired, function (req, res) {
    var id = req.body.movie._id;
    var movieObj = req.body.movie;
    var _movie;
    if (id) {
      Movie.findById(id, function (err, movie) {
        if(err) {
          console.log(err);
        }
        _movie = _.extend(movie, movieObj);
        _movie.save(function(err, movie) {
          if(err) {
            console.log(err);
          }
          res.redirect("/movie/" + movie._id);
        });
      });
    } else {
      _movie = new Movie({
        director: movieObj.director,
        title: movieObj.title,
        country: movieObj.country,
        language: movieObj.language,
        year: movieObj.year,
        poster: movieObj.poster,
        summary: movieObj.summary,
        flash: movieObj.flash,
      });
      _movie.save(function(err, movie) {
        if(err) {
          console.log(err);
        }
        res.redirect("/movie/" + movie._id);
      });
    }
  });

  app.get("/admin/movie/list", signinRequired, adminRequired, function (req, res) {
    Movie.fetch(function (err, movies) {
      if (err) {
        console.log(err);
      }
      res.render("list", {
        title: "iMovie 列表页",
        movies: movies,
      });
    });
  });

  app.delete("/admin/movie/delete", signinRequired, adminRequired, function (req, res) {
    var id = req.query.id;
    if (id) {
      Movie.remove({ _id: id }, function (err, movie) {
        if (err) {
          console.log(err);
        } else {
          res.json({ success: 1 });
        }
      });
    }
  });

  app.get("/admin/user/list", signinRequired, adminRequired, function (req, res) {
    User.fetch(function (err, users) {
      if (err) {
        console.log(err);
      }
      res.render("userlist", {
        title: "iMovie 用户列表页",
        users: users,
      });
    });
  });
}
