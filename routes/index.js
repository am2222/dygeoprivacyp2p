
var express = require('express');

// const client = new Client({});
var router = express.Router();

router.get('/', function (req, res) {

    res.render('pages/index', {
      title: "What's in stock!"
    });

});


router.get('/test', function (req, res) {

  res.render('pages/test', {
    title: "What's in stock!"
  });

});
router.get('/import', function (req, res) {

  res.render('pages/import', {
    title: "What's in stock!"
  });

});

router.get('/profile/:root/:uid/', function (req, res) {

  res.render('pages/profile', {
    root: req.params["root"],
    dbname: req.params["uid"],
  });

});

module.exports = router;