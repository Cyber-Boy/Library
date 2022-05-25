const mysql = require("mysql");
module.exports = mysql.createConnection({
  host: "10.74.2.54",
  user: "ash",
  password: "mypassword",
  database: "LMS",
  port: 3306,
});
