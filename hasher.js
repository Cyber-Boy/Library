const crypto = require("crypto");

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
