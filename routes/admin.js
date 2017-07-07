var Movie = require("../models/movie");
var User = require("../models/user");
var Category = require("../models/category");
var _ = require("underscore");
var fs = require("fs");
var path = require("path");

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

var savePoster = function (req, res, next) {
  var posterData = req.files.uploadPoster;
  var filePath = posterData.path;
  var originalFilename = posterData.originalFilename;
  if (originalFilename) {
    fs.readFile(filePath, function (err, data) {
      var timestamp = Date.now();
      var type = posterData.type.split("/")[1];
      var poster = timestamp + "." + type;
      var newPath = path.join(__dirname, "../", "/public/upload/" + poster);
      console.log(data);
      fs.writeFile(newPath, data, function (err) {
        req.poster = poster;
        next();
      });
    });
  } else {
    next();
  }
};

module.exports = function (app) {

  app.get("/admin/category/new", signinRequired, adminRequired, function (req, res) {
    res.render("category_admin", {
      title: "iMovie 后台分类录入页",
      category: {},
    });
  });

  app.post("/admin/category/new", signinRequired, adminRequired, function (req, res) {
    var _category = req.body.category;
    var category = new Category(_category);
    category.save(function (err, category) {
      if (err) {
        console.log(err);
      }
      res.redirect("/admin/category/list");
    });
  });

  app.get("/admin/category/list", signinRequired, adminRequired, function (req, res) {
    Category.fetch(function (err, categories) {
      if (err) {
        console.log(err);
      }
      res.render("categorylist", {
        title: "iMovie 分类列表页",
        categories: categories,
      });
    });
  });

  app.get("/admin/movie/new", signinRequired, adminRequired, function (req, res) {
    Category.find({}, function (err, categories) {
      res.render("admin", {
        title: "iMovie 后台录入页",
        categories: categories,
        movie: {},
      });
    });
  });

  app.get("/admin/movie/update/:id", signinRequired, adminRequired, function(req, res) {
    var id = req.params.id;
    if (id) {
      Movie.findById(id, function(err, movie) {
        Category.find({}, function (err, categories) {
          res.render("admin", {
            title: "iMovie 后台更新页",
            categories: categories,
            movie: movie,
          });
        });
      });
    }
  });

  app.post("/admin/movie/new", signinRequired, adminRequired, savePoster, function (req, res) {
    var id = req.body.movie._id;
    var movieObj = req.body.movie;
    console.log(movieObj);
    var _movie;
    if (req.poster) {
      movieObj.poster = req.poster;
    }
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
      _movie = new Movie(movieObj);
      var categoryId = movieObj.category;
      var categoryName = movieObj.categoryName;
      _movie.save(function(err, movie) {
        if(err) {
          console.log(err);
        }
        if (categoryId) {
          Category.findById(categoryId, function (err, category) {
            category.movies.push(movie._id);
            category.save(function (err, category) {
              res.redirect("/movie/" + movie._id);
            });
          });
        } else if (categoryName) {
          var category = new Category({
            name: categoryName,
            movies: [movie._id],
          });
          category.save(function (err, category) {
            movie.category = category._id;
            movie.save(function (err, movie) {
              res.redirect("/movie/" + movie._id);
            });
          });
        }
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
