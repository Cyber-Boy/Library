const express = require("express");
const db = require("./database");
db.connect();
const app = express();
app.set("view engine","ejs");

//Body parser (IDK what it exactly does?)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//ENVs setting the port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>{
    console.log(`Server started at ${PORT}`);
});

//Setting view engine to ejs
app.set("view engine","ejs");

//routes
app.get("/", function (req,res){
    res.render("index");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function (req,res){
    res.render("register");
});

app.get("/dashboard", function (req,res){
    res.render("dashboard");
});