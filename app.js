const session = require("express-session");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const ejs = require("ejs");

const { DynamoDB } = require("@aws-sdk/client-dynamodb");

const dynamodb = new DynamoDB({
  region: "us-east-1",
  credentials: {
    accessKeyId: "*****",
    secretAccessKey: "*******",
  },
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

app.get("/", (req, res) => {
  //get function to render login.ejs
  res.render("login.ejs", { error: null });
});

app.get("/home", (req, res) => {
  //get function to render home.ejs
  res.render("homepage.ejs");
});

app.get("/register", (req, res) => {
  //get function to render register.ejs
  res.render("register.ejs");
});

app.post("/auth_login", (req, res) => {
  //post function to authorize user login
  let email = req.body.email, //declare email/password variable
    password = req.body.password;

  const params = {
    TableName: "users",
    Key: {
      email: { S: email },
    },
    ProjectionExpression: "password",
  };

  dynamodb.getItem(params, (err, data) => {
    if (err) {
      console.log(err);
      res.render("login.ejs", { error: "User not found" });
    } else {
      if (
        !data.Item ||
        !data.Item.password ||
        password !== data.Item.password.S
      ) {
        res.render("login.ejs", { error: "Invalid email or password" });
      } else {
        res.render("homepage.ejs");
      }
    }
  });
});

app.post("/auth_register", (req, res) => {
  let register_data = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  };
  const params = {
    TableName: "users",
    Item: {
      name: { S: register_data.name },
      email: { S: register_data.email },
      password: { S: register_data.password },
    },
  };
  const checkParams = {
    TableName: "users",
    Key: {
      email: { S: register_data.email },
    },
  };
  dynamodb.getItem(checkParams, function (err, data) {
    if (err) {
      console.log("Error checking if email already exists:", err);
    } else if (data.Item) {
      console.log("Email already registered:", data);
      res.render("register_error.ejs", {
        message: "This email address is already registered.",
      });
    } else {
      dynamodb.putItem(params, function (err, data) {
        if (err) {
          console.log("Error adding item to table:", err);
        } else {
          console.log("Item added to table:", data);
          res.render("register_success.ejs");
        }
      });
    }
  });
});


app.get("*", (req, res) => {
  res.send("404 - Page not found"); //set other unknown pages as 404
});

app.listen(80, () => {
  //listen to port
  console.log("Port established in 80"); //output to console
});
