require("dotenv").config();
const mysql = require("mysql");
module.exports = mysql.createConnection({
  host: "0.0.0.0",
  user: "root",
  password: process.env.PASSWORD,
  database: "LMS",
  port: 3306,
});