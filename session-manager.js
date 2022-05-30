const db = require("./database")
db.connect();

class OwnSession {
    constructor(){
     this.sessions = {};
    }
  
    getUser(sessionId){
     return this.sessions[sessionId];
    }
  
    setUser(sessionId, userData){
     if(this.sessions[sessionId]){
       Object.assign(this.sessions[sessionId], userData);
       return;
     }
  
      this.sessions[sessionId] = userData;
    }
    validateCookies(req,res,next) {
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
              console.log(result[0])
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
    
    isAdmin (req,res,next) {
      if(req.adminAuth === 1){
        next();
      }
      else{
        res.status(403).send({ 'msg': 'Not Authenticated'});
      }
    }
}

module.exports = new OwnSession();