const crypto = require("crypto");
const express = require("express");
const db = require("./database");
const sessionManager = require("./session-manager");
db.connect();
const app = express();
app.set("view engine", "ejs");

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
  db.query(
    `SELECT SALT,HASH,ID FROM USERS WHERE USERNAME = ${db.escape(username)};`,
    (err,result,field) => {
      if (err){
        throw err
      }
      else{
        //check if result is a list or not
        let hash = crypto.createHash("sha256").update(password + result[0].SALT).digest("base64");
        //console.log(hash)
        if (hash === result[0].HASH){
          console.log(`${username} logged in!`);
          console.log(result[0].ID);
          //let sessionID = crypto.createHash('sha256').update(`${result[0].ID}`).digest("base64");
          let sessionID = btoa(result[0].ID)
          res.cookie("sessionID",sessionID,{
            maxAge: 5000,
            httpOnly: true,
            //secure: true
          });
          //console.log(`INSERT INTO COOKIES VALUES('${result[0].ID}',${sessionID});`)
          db.query(
            `INSERT INTO COOKIES VALUES('${sessionID}','${result[0].ID}');`
          );
          res.redirect("/browse");
          //sessionManager.setUser()
          //req.render(`dashboard`, {data:probably somecookie});
        }
        else if (hash !== result[1]){
          console.log(`Incorrect login attempt for ${username}`);
          res.render(`login`, {data: "Incorrect ID or Password"});
        }
        else{
          console.log("some unexpected error occured");
        }
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
    "select * from USERS where NAME = " + db.escape(name) + ";",
    (err, result, field) => {
      if (err){
        throw err
      }
      else{
        if (result[0] === undefined) {
          if (name && (password === passwordC)) {
            db.query(
              `INSERT INTO USERS (USERNAME, NAME, ENO, SALT, HASH) VALUES(${db.escape(username)},${db.escape(name)},${db.escape(eno)},'${pass.salt}', '${pass.hash}');`
            );
            res.send("Registered Successfully!")
            //res.render(`somefile`, {data:some var in this block or function lmao}) Most probably dashboard
          } else if (password !== passwordC) {
            res.send("Passwords didn't match");
          } else {
            res.send("Password must not be empty");
          }
        } else {
          res.send("Username is not unique");
        }
      }
    }
  );
});

app.get("/dashboard", function (req, res) {
  res.render("dashboard");
});

app.get("/browse", validateCookies, function (req,res) {
  let books = [];
  db.query(
    `SELECT NAME, AUTHOR, STATUS, BOOKID FROM BOOKS`,
    (err,result,field) => {
      if (err){
        throw err
      }
      else{
        //console.log(result);
        result.forEach((book)=>{
          //console.log(book.BOOKID);
          books.push({NAME: book.NAME, AUTHOR: book.AUTHOR, STATUS: book.STATUS, BOOKID: book.BOOKID});
        });
        //console.log(books[0].BOOKID)
        res.render("browse",{books})
      }
    }
  );
});

app.post("/browse", function (req,res) {
  let name = req.body.name;
  let author = req.body.author;
  let books = [];
  db.query(
    `SELECT * FROM BOOKS WHERE NAME=${db.escape(name)} OR AUTHOR=${db.escape(author)};`, 
    (err,result,field) => {
      if (err){
        throw err
      }
      else{
        if ((name === result[0].NAME) || (author === result[0].AUTHOR)){
          books.push({NAME: result[0].NAME, AUTHOR: result[0].AUTHOR, STATUS: result[0].STATUS, BOOKID: result[0].BOOKID});
          res.render(`browse`,{books})
        }
      }
    }
  )
});

app.get("/book/:bookID",validateCookies, function (req,res) {
  let bookID = req.params.bookID;
  db.query(
    `SELECT * FROM BOOKS WHERE BOOKID=${db.escape(bookID)};`,
    (err,result,field)=>{
      if (err){
        throw err
      }
      else{
        console.log(result);
        let book = {NAME: result[0].NAME, AUTHOR: result[0].AUTHOR, STATUS: result[0].STATUS, USERID: result[0].USERID};
        res.render("book", {book});  
      }
    } 
  )
});

//Creating Middleware
function validateCookies(req,res,next) {
  //console.log(req.headers.cookie.slice(10));
  const cookie = req.headers.cookie.slice(10);
  if (req.headers.cookie.includes("sessionID")){
    console.log(`SELECT USERID, SESSIONID FROM USERS WHERE SESSIONID=${db.escape(cookie)};`)
    console.log(`${db.escape(cookie)}`);
    db.query(
      `SELECT USERID, SESSIONID FROM COOKIES WHERE SESSIONID=${db.escape(cookie)};`,
      (err,result,field) =>{
        if (err){
          throw err;
        }
        else{
          console.log(`${cookie}`);
          console.log(result)
          console.log(`${result[0].SESSIONID}`)
          if (cookie===result[0].SESSIONID){
            next();
          }
          else{
            res.status(403).send({ 'msg': 'Not Authenticated'});
          }
        }
      }
    )
  }
  else {
    res.status(403).send({ 'msg': 'Not Authenticated'});
  }
}