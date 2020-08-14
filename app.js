//include the libraries
var express = require("express");
var path = require("path");

var os = require("os");
var cors = require("cors");
// var favicon = require('serve-favicon');
var bodyParser     =        require("body-parser");
var cookieParser = require('cookie-parser');
var routes = require('./routes/index');



//Express app
const app = express();

// Configuration
const port = 8000;

app.set("title", "What's in stock!");
app.set("views",  path.join(__dirname, 'views'));


app.set('view engine', 'ejs');


app.use(express.static( path.join(__dirname, 'public')));
app.use(cors());
//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// initialize cookie-parser to allow us access the cookies stored in the browser. 
app.use(cookieParser());


app.use('/', routes);



var server = app.listen(port, () =>
  console.log(`Server is listening on port ${port}!`)
);





module.exports = server;
