const validator = require("validator")

const inputVerification = (req,res,next)=>{

    if(req.body.email==null || req.body.email==undefined)
    {return res.status(403).json({"error":"EMAIL UNDEFINED"})}

    if(req.body.password==null || req.body.password==undefined)
    {return res.status(403).json({"error":"PASSWORD UNDEFINED"})}

    const email = req.body.email
    const password = req.body.password

    if(validator.isEmpty(email))
    {return res.status(403).json({"error":"EMAIL CAN'T BE EMPTY"})}

    if(validator.isEmpty(password))
    {return res.status(403).json({"error":"PASSWORD CAN'T BE EMPTY"})}

    if(!validator.isEmail(email))
    {return res.status(403).json({"error":"INVALID EMAIL ADRESSE"})}

    if(!validator.isLength(password, {min:5, max:20}))
    {return res.status(403).json({"error":"PASSWORD MUST BE : MIN 5 & MAX 20 CHARS"})}
    
    if(!validator.isLength(email, {min:5, max:20}))
    {return res.status(403).json({"error":"PASSWORD MUST BE : MIN 5 & MAX 20 CHARS"})}

    next()
}

module.exports = inputVerification