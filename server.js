var express = require("express");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var mqtt = require('mqtt')


var app = express();
const User = require('./models/User')
const Location = require('./models/Location')

// set our application port
app.set("port", 3000);

//session time 30 days
var expire_time = 30;

var rememberBox = false;



app.use(bodyParser.urlencoded({extended:true}))

app.use(cookieParser());

app.use(
    session({
        key: 'user_sid',
        secret:"thisIsSecret",
        resave:true,
        saveUninitialized:true,
        cookie:{
            //set session time to 30 days
            maxAge: expire_time * 1000 * 60 * 60 * 24,
        },
    })
);

app.use(express.static(__dirname + '/public'));

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie("user_sid");
  }
  next();
});

// app.all('*', function findLastVisit(req, res, next) {
//   if (req.session.visited)
//     req.lastVisit = req.session.visited;
    
//     last_date = req.lastVisit

//   req.session.visited = Date.now();

//   console.log(req.lastVisit);

//   next();
// });

var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
      res.redirect("/maps");
    } else {
      next();
    }
  };

  app.get("/", sessionChecker, (req, res) => {
    res.redirect("/login");
  });

  app.route('/login').get(sessionChecker, (req, res) => {
      res.sendFile(__dirname+'/public/login.html');
  })
  .post(async (req, res) => {


    var email = req.body.email,
    password = req.body.password,
    remember = req.body.remember;

    if(remember == "on")
      {rememberBox = true;  }
    else{ 
      rememberBox = false;
      req.session.cookie.expires = false;
      }

      try {
        var user = await User.findOne({ email: email }).exec();
        if(!user) {
            res.redirect("/login");
        }
        user.comparePassword(password, (error, match) => {
            if(!match) {
              res.redirect("/login");
            }
        });

        req.session.user = user;
        req.session.remember = rememberBox;

        console.log(rememberBox);


        //check if visited
        console.log(req.session.cookie)
        

        res.redirect("/maps");
    } catch (error) {
      console.log(error)
    }
  });


//route for sign up
  app.route('/signup').get(sessionChecker, (req, res) => {
    res.sendFile(__dirname+'/public/signup.html');
})
.post((req, res) => {
  console.log("here")
    var user = new User({
      username: req.body.username,
      email: req.body.email,
      password:req.body.password,
    });
    console.log(req.body.username);
    user.save((err, docs) => {
      if (err) {
        res.redirect("/signup");
      } else {
        console.log(docs)
        req.session.user = docs;
        res.redirect("/maps");
      }
    });
  });


app.get("/session_info", (req,res)=>{
  var user_info = {
    username: "",
    email: "",
    remember: false,
    last_time: ""
  };

  if(req.session.user && req.cookies.user_sid){
    user_info.username = req.session.user.username
    user_info.remember = req.session.remember;
    user_info.email = req.session.user.email;

    console.log(req.session.last_time)

    if( req.session.last_time){
      user_info.last_time =   req.session.last_time;
    }
    else{
      user_info.last_time = ''
    }

    req.session.last_time = Date.now()
   // console.log(req.session.last_time)



}
res.send(user_info);
});

// route for user logout
app.get("/logout", (req, res) => {

  console.log('in logout')
  if (req.session.user && req.cookies.user_sid) {
    res.clearCookie("user_sid")
    res.redirect("/");

  } else {
    res.redirect("/error");
  }
});

  app.get("/maps", (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
      res.sendFile(__dirname + "/public/maps.html");
    } else {
      res.redirect("/error");
    }
  });


  app.get("/arrow", (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
      res.sendFile(__dirname + "/public/arrow.html");
    } else {
      res.redirect("/error");
    }
  });



// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
  res.sendFile(__dirname + "/public/error.html")
});


app.listen(app.get("port"), () =>
  console.log(`App started on port ${app.get("port")}`)
);


var client = mqtt.connect('mqtt://localhost:1883')


client.on('connect', function () {
    client.subscribe('location', function (err) {
        if (err)
            console.log(err);
        else
            console.log('connected to mqtt succesffully')
    })
})

client.on('message', function (topic, message) {
  

    if (topic == 'location') {
     // console.log(message.toString())
      var coords = JSON.parse(message.toString());

      const newLoc = {
        email: coords.email,
        current: coords.current,
        destination: coords.destination
      };
      
      new Location(newLoc).save((err, user) =>{
        if (err) {
            console.log(err);
        } 
    });
  }
});

