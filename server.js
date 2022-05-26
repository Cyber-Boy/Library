const crypto = require("crypto");
const express = require("express");
const { Z_ASCII } = require("zlib");
//const db = require("./database");
//db.connect();
const app = express();
app.set("view engine", "ejs");

const mysql = require("mysql");
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "mypassword",
  database: "LMS",
  port: 3306,
});

db.connect();

//Hashing function
function hashPassword(password) {
  var salt = crypto.randomBytes(128).toString("base64");
  var hash = crypto
    .createHash("sha256")
    .update(password + salt)
    .digest("base64");

  return {
    salt: salt,
    hash: hash,
  };
}

//Body parser (IDK what it exactly does?)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//ENVs setting the port
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server started at ${PORT}`);
});

//Setting view engine to ejs
app.set("view engine", "ejs");

//routes
app.get("/", function (req, res) {
  res.render("index");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", function (req,res){
  let username = req.body.username;
  let password = req.body.password;
  console.log(`SELECT SALT,HASH FROM USERS WHERE USERNAME = ${db.escape(username)};`)
  db.query(
    `SELECT SALT,HASH FROM USERS WHERE USER = ${db.escape(username)};`,
    (err,result,field) => {
      console.log(result)
      //check if result is a list or not
      let hash = crypto.createHash("sha256").update(password + result[0]).digest("base64");
      if (hash === result[0].HASH){
        console.log(`${username} logged in!`)
        //req.render(`dashboard`, {data:probably somecookie});
      }
      else if (hash !== result[1]){
        console.log(`Incorrect login attempt for ${username}`);
        req.render(`login`, {data: "Incorrect ID or Password"});
      }
      else{
        console.log("some unexpected error occured");
      }
    }
  )
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  let name = req.body.name;
  let username = req.body.username;
  let password = req.body.password;
  let eno = req.body.eno;
  let passwordC = req.body.confirmPassword;
  var pass = hashPassword(password);
  db.query(
    "select * from users where NAME = " + db.escape(name) + ";",
    (err, result, field) => {
    console.log(result)
      if (result === undefined) {
        if (name && (password === passwordC)) {
          db.query(
            `INSERT INTO USERS VALUES(${db.escape(username)},${db.escape(name)},${db.escape(eno)},'${pass.salt}', '${pass.hash}');`
          );
          res.send("Cool")
          //res.render(`somefile`, {data:some var in this block or function lmao}) Most probably dashboard
        } else if (password !== passwordC) {
          res.send("Passwords didn't match");
        } else {
          res.send("password must not be empty");
        }
      } else {
        console.log("LMAO GG")
        console.log(result);
        res.send("Username is not unique");
      }
    }
  );
});

app.get("/dashboard", function (req, res) {
  res.render("dashboard");
});
