const crypto = require("crypto");
const express = require("express");
const db = require("./database");
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
app.use(express.static(__dirname + '/public'));

//ENVs setting the port
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server started at ${PORT}`);
  console.log(__dirname)
});

//Setting view engine to ejs
app.set("view engine", "ejs");

//routes
app.get("/", (req, res)=> {
  res.render("index");
});

app.get("/login", (req, res)=> {
  res.render("login");
});

app.post("/login", (req,res)=>{
  let username = req.body.username;
  let password = req.body.password;
  db.query(
    `SELECT SALT,HASH,ID, ADMIN FROM USERS WHERE USERNAME = ${db.escape(username)};`,
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
          //console.log(result[0].ID);
          //let sessionID = crypto.createHash('sha256').update(`${result[0].ID}`).digest("base64");
          let sessionID = crypto.randomUUID();
          res.cookie("sessionID",sessionID,{
            maxAge: 12000000,
            httpOnly: true,
            //secure: true
          });
          //console.log(`INSERT INTO COOKIES VALUES('${result[0].ID}',${sessionID});`)
          db.query(
            `INSERT INTO COOKIES VALUES(${db.escape(sessionID)},'${db.escape(result[0].ID)}');`
          );
          if (result[0].ADMIN === 1){
            res.redirect("/dashboard")
          }
          else{
            res.redirect("/browse");
          }
          //sessionManager.setUser();
          //req.render(`dashboard`, {data:probably somecookie});
        }
        else if (hash !== result[1]){
          console.log(`Incorrect login attempt for ${username}`);
          res.render(`login`, {data: "Incorrect ID or Password"});
        }
        else{
          console.log("Some Unexpected Error Occured!");
        }
      }
    }
  )
});

app.get("/register", (req, res)=> {
  res.render("register");
});

app.post("/register", (req, res)=> {
  let name = req.body.name;
  let username = req.body.username;
  let password = req.body.password;
  let eno = req.body.eno;
  let passwordC = req.body.confirmPassword;
  var pass = hashPassword(password);
  db.query(
    "select * from USERS where USERNAME = " + db.escape(username) + ";",
    (err, result, field) => {
      if (err){
        throw err
      }
      else{
        if (result[0] === undefined) {
          if (name && (password === passwordC)) {
            db.query(
              `INSERT INTO USERS (USERNAME, NAME, ENO, SALT, HASH, ADMIN) VALUES(${db.escape(username)},${db.escape(name)},${db.escape(eno)},'${pass.salt}', '${pass.hash}', 0);`
            );
            res.render("success");
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

app.get("/browse", validateCookies, (req,res)=> {
  let books = [];
  db.query(
    `SELECT NAME, AUTHOR, STATUS, BOOKID, QUANTITY FROM BOOKS`,
    (err,result,field) => {
      if (err){
        throw err
      }
      else{
        //console.log(result);
        result.forEach((book)=>{
          //console.log(book.BOOKID);
          books.push({NAME: book.NAME, AUTHOR: book.AUTHOR, STATUS: book.STATUS, BOOKID: book.BOOKID, QUANTITY: book.QUANTITY});
        });
        //console.log(books[0].BOOKID)
        res.render("browse",{books})
      }
    }
  );
});

app.post("/browse", validateCookies, (req,res)=> {
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
          books.push({NAME: result[0].NAME, AUTHOR: result[0].AUTHOR, STATUS: result[0].STATUS});
          res.render(`browse`,{books})
        }
      }
    }
  )
});

app.get("/book/:bookID",validateCookies, (req,res)=> {
  let bookID = req.params.bookID;
  db.query(
    `SELECT * FROM BOOKS WHERE BOOKID=${db.escape(bookID)};`,
    (err,result,field)=>{
      if (err){
        throw err
      }
      else{
        //console.log(result);
        let book = {NAME: result[0].NAME, AUTHOR: result[0].AUTHOR, STATUS: result[0].STATUS, ID: result[0].BOOKID, USERID: result[0].USERID, QUANTITY: result[0].QUANTITY};
        db.query(
          `SELECT BOOKID FROM USERS WHERE ID=${db.escape(req.userID)};`,
          (err1,result1,field1)=>{
            if (err1){
              throw err1;
            }
            else{
              let user = {USERID: req.userID, BOOKID: result1[0].BOOKID}
              res.render("book", {book, user});  
            }
          }
        )
      }
    } 
  )
});

app.get("/myBooks", validateCookies, (req,res)=>{
  let userID = req.userID;
  let books = [];
  db.query(
    `select USERS.BOOKID , BOOKS.NAME, BOOKS.AUTHOR, BOOKS.QUANTITY FROM BOOKS INNER JOIN USERS ON BOOKS.BOOKID = USERS.BOOKID WHERE USERS.ID = ${db.escape(userID)};`,
    (err,result,field)=>{
      if (err){
        throw err;
      }
      else{
        result.forEach((book)=>{
          //console.log(book.BOOKID);
          books.push({NAME: book.NAME, AUTHOR: book.AUTHOR, BOOKID: book.BOOKID, QUANTITY: book.QUANTITY});
        });
        res.render("browse",{books});
      }
    }
  )
});

app.get("/book/:bookID/:userID", validateCookies, (req,res)=>{
  let bookID = req.params.bookID;
  let userID = req.params.userID;
  db.query(
    `UPDATE USERS SET BOOKID = ${db.escape(bookID)} WHERE ID = ${db.escape(userID)};`,
    (err, result, field) =>{
      if (err){
        throw err;
      }
      else{
        db.query(
          `UPDATE BOOKS SET STATUS='WAITING' WHERE BOOKID=${db.escape(bookID)};`
        )
        res.redirect("/browse");
      }
    }
  );
});

app.get("/book/:bookID/:userID/return", validateCookies, (req,res) =>{
  let bookID = req.params.bookID;
  let userID = req.params.userID;
  db.query(
    `UPDATE USERS SET BOOKID = NULL WHERE ID= ${userID};`,
    (err,result, field) => {
      if (err){
        throw err;
      }
      else{
        db.query(
          `UPDATE BOOKS SET QUANTITY=QUANTITY+1 WHERE BOOKID=${bookID};`
        )
        res.redirect("/browse");
      }
    }
  )
});

app.get("/add",validateCookies, isAdmin, (req,res)=>{
  res.render("add");
});

app.post("/add", validateCookies, isAdmin,(req,res)=>{
  let bname = req.body.bname;
  let author = req.body.author;
  let quantity = req.body.quantity;
  db.query(
    `INSERT INTO BOOKS (NAME, AUTHOR, STATUS,QUANTITY) VALUES(${db.escape(bname)}, ${db.escape(author)}, 'AVAILABLE', ${db.escape(quantity)});`,
    (err,result,field) => {
      res.send("New Book Added!")
    }
  );
});

app.get("/remove/:bookID", validateCookies, isAdmin, (req,res)=>{
  let bookID = req.params.bookID;
  console.log("Removing Book!")
  db.query(
    `DELETE FROM BOOKS WHERE BOOKID=${db.escape(bookID)};`,
    (err,result,field) =>{
      res.redirect("/list");
    }
  )
});

app.get("/list",validateCookies, isAdmin, (req, res) => {
  let books = [];
  db.query(
    `SELECT * FROM BOOKS;`,
    (err,result,field) =>{
      if (err){
        throw err;
      }
      else{
        result.forEach((book)=>{
          //console.log(book.BOOKID);
          books.push({NAME: book.NAME, AUTHOR: book.AUTHOR, STATUS: book.STATUS, BOOKID: book.BOOKID});
        });
        res.render("list", {books})
      }
    }
  )
});

app.get("/listIssues", validateCookies, isAdmin, (req, res) =>{
  let users = [];
  db.query(
  `SELECT * FROM USERS WHERE BOOKID!=NULL;`,
  (err, result, field)=>{
    if (err){
      throw err;
    }
    else{
      result.forEach((user)=>{
        users.push({NAME: user.NAME, ENO: user.ENO, USERID: user.ID, BOOKID: user.BOOKID});
      });
      res.render("listIssues",{users})
    }
  })
});

app.get("/approve/:bookID", validateCookies, isAdmin, (req,res) => {
  let bookID = req.params.bookID;
  console.log("Running approve function")
  db.query(
    `UPDATE BOOKS SET QUANTITY=QUANTITY-1 WHERE BOOKID=${db.escape(bookID)};`,
    (err,result,field) => {
      if (err){
        throw err;
      }
      else{
      db.query(
        `SELECT QUANTITY FROM BOOKS WHERE BOOKID=${db.escape(bookID)};`,
        (err,result,field) =>{
          if (result[0].QUANTITY === 0){
            db.query(`UPDATE BOOKS SET STATUS="UNAVAILABLE" WHERE BOOKID=${db.escape(bookID)};`);
          }
          else{
            db.query(`UPDATE BOOKS SET STATUS="AVAILABLE" WHERE BOOKID=${db.escape(bookID)};`)
          }
        }
      );
      res.redirect("/list");
      }
    }
  );
});

app.get("/reject/:bookID", validateCookies, isAdmin, (req,res)=>{
  let bookID = req.params.bookID;
  db.query(
    `UPDATE BOOKS SET STATUS="AVAILABLE" WHERE BOOKID=${db.escape(bookID)};`,
    (err,result,field)=>{
      res.redirect("/list");
    }
  )
});

app.get("/dashboard", validateCookies, isAdmin, (req,res)=>{
  res.render("dashboard");
});

app.get("/signout", validateCookies, (req,res) =>{
  req.headers.cookie = null
  db.query(
    `DELETE FROM COOKIES WHERE USERID=${db.escape(req.userID)};`,
    (err,result,field) => {
      if (err){
        throw err
      }
      else {
        res.send("User Signed out successfully!")
      }
    }
  )
});


//Creating Middleware
function validateCookies(req,res,next) {
  req.adminAuth = 0;
  //console.log(req.headers.cookie.slice(10));
  const cookie = req.headers.cookie.slice(10);
  if (req.headers.cookie.includes("sessionID")){
    //console.log(req)
    //console.log(`SELECT USERID, SESSIONID FROM USERS WHERE SESSIONID=${db.escape(cookie)};`)
    //console.log(`${db.escape(cookie)}`);
    db.query(
      `SELECT COOKIES.USERID, COOKIES.SESSIONID, ADMIN FROM COOKIES, USERS WHERE SESSIONID=${db.escape(cookie)} AND USERS.ID=COOKIES.USERID;`,
      (err,result,field) =>{
        if (err){
          throw err;
        }
        else{
          //console.log(`${cookie}`);
          //console.log(result)
          //console.log(`${result[0].SESSIONID}`)
         0// console.log(result[0])
          if (result[0].ADMIN === 1){
            req.adminAuth = 1;
          }
          else{
            req.adminAuth = 0;
          }
          if (cookie===result[0].SESSIONID){
            req.userID = result[0].USERID;
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

function isAdmin (req,res,next) {
  if(req.adminAuth === 1){
    next();
  }
  else{
    res.status(403).send({ 'msg': 'Not Authenticated'});
  }
}