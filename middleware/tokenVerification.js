const jwt = require("jsonwebtoken")
require("dotenv").config()

const tokenVerification = (req,res,next)=>{

    if(req.headers.authorization==null || req.headers.authorization==undefined)
    {return res.status(403).json({"error":"TOKEN UNDEFINED"})}

    const token = req.headers.authorization.split(" ")[1]

    try{

        const resultat = jwt.verify(token, process.env.SECTOKEN)
        
        if(resultat){
            next()
        }else{
            return res.status(403).json({"error":"INVALID TOKEN"})
        }

    }catch{
        return res.status(403).json({"error":"INVALID TOKEN"})
    }
}

module.exports = tokenVerification