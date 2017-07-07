var Movie = require("../models/movie");
var User = require("../models/user");
var Comment = require("../models/comment");
var Category = require("../models/category");

var signinRequired = function (req, res, next) {
  var user = req.session.user;
  if (!user) {
    return res.redirect("/signin");
  }
  next();
};

module.exports = function (app) {
  app.get("/", function (req, res) {
    Category.find({})
      .populate({
        path: "movies",
        options: {
          limit: 5,
        },
      })
      .exec(function (err, categories) {
        if (err) {
          console.log(err);
        }
        res.render("index", {
          title: "iMovie 首页",
          categories: categories,
        });
      });
  });

  app.get("/movie/:id", function (req, res) {
    var id = req.params.id;
    Movie.update({_id: id}, {$inc: {pv: 1}}, function (err) {
      if (err) {
        console.log(err);
      }
    });
    Movie.findById(id, function (err, movie) {
      Comment.find({ movie: id })
        .populate("from", "name")
        .populate("reply.from reply.to", "name")
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
    User.findOne({ name: _user.name }, function (err, user) {
      if (err) {
        console.log(err);
      }
      if (user) {
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
    if (_comment.cid) {
      Comment.findById(_comment.cid, function (err, comment) {
        var reply = {
          from: _comment.from,
          to: _comment.tid,
          content: _comment.content,
        };
        comment.reply.push(reply);
        comment.save(function (err, comment) {
          if (err) {
            console.log(err);
          }
          res.redirect("/movie/" + movieId);
        });
      });
    } else {
      var comment = new Comment(_comment);
      comment.save(function (err, comment) {
        if (err) {
          console.log(err);
        }
        res.redirect("/movie/" + movieId);
      });
    }
  });

  app.get("/results", function (req, res) {
    var categoryId = req.query.category;
    var q = req.query.q;
    var page = parseInt(req.query.page, 10) || 1;
    var count = 10;
    var index = (page - 1) * count;
    if (categoryId) {
      Category.findOne({ _id: categoryId })
        .populate({
          path: "movies",
          select: "title poster",
        })
        .exec(function (err, category) {
          if (err) {
            console.log(err);
          }
          var movies = category.movies;
          var results = movies.slice(index, index + count);
          res.render("results", {
            title: "iMovie 结果列表页面",
            keyword: category.name,
            totalPage: Math.ceil(movies.length / count),
            currentPage: page,
            query: "category=" + categoryId,
            movies: results,
          });
        });
    } else {
      Movie.find({ title: new RegExp(q + ".*", "i") })
        .exec(function (err, movies) {
          if (err) {
            console.log(err);
          }
          console.log(movies);
          var results = movies.slice(index, index + count);
          res.render("results", {
            title: "iMovie 结果列表页面",
            keyword: q,
            currentPage: page,
            query: "q=" + q,
            totalPage: Math.ceil(movies.length / count),
            movies: results,
          });
        });
    }
  });
};
