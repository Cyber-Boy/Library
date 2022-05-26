const mysql = require("mysql");
module.exports = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "mypassword",
  database: "LMS",
  port: 3306,
});