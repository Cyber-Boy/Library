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
      const { cookies } = req;
      if ("sessionID" in coookies){
        if (cookies.sessionID==="somesessionID"){
          next();
        }
        else{
          res.status(403).send({ 'msg': 'Not Authenticated'});
        }
      }
      else {
        res.status(403).send({ 'msg': 'Not Authenticated'});
      }
    }
}

module.exports = new OwnSession();