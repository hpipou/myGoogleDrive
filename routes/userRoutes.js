const express = require("express")
const route = express.Router()
const registerInputVerif = require("../middleware/registerInputVerification")
const loginInputVerif = require("../middleware/loginInputVerification")
const models = require("../models")
const jwt = require("jsonwebtoken")
const uuid = require("uuid")
const bcrypt = require("bcrypt")
require("dotenv").config()

// créer un compte
route.post("/register",registerInputVerif, (req,res)=>{

    

    // verifier si l'email existe déja
    models.User.findOne({attributes:['id'], where:{email:req.body.email}})
        .then((data)=>{
            if(data){
                return res.status(403).json({"error":"EMAIL ALREADY EXIST"})
            }else{
                checkUsername()
            }
        })
        .catch((error)=>{return res.status(500).json(error)})

    // verifier si l'username existe déja
    function checkUsername(){
        models.User.findOne({attributes:['id'], where:{username:req.body.username}})
        .then((dataUsername)=>{
            if(dataUsername){
                return res.status(403).json({"error":"USERNAME ALREADY EXIST"})
            }else{
                createAccount()
            }
        })
        .catch((error)=>{return res.status(505).json(error)})
    }

    // créer le compte
    function createAccount(){
        

        const myUUID = uuid.v4()
        
        models.User.create({
            id:myUUID,
            username:req.body.username,
            email:req.body.email,
            password: bcrypt.hashSync(req.body.password, 5),
            role:"USER",
            accountStatus:"ACTIVE",
            freeSpace: 100,
            usedSpace: 0
        })
        .then(()=>{

            const token = jwt.sign(
                {"id":myUUID, "username":req.body.username, "role":"USER"},
                process.env.SECTOKEN,
                {expiresIn:'48h'}
                )
            
            return res.status(201).json({
                "token":token,
                "id":myUUID, 
                "username":req.body.username, 
                "role":"USER"
            })
        })
        .catch((error)=>{return res.status(500).json(error)})
    }

})

// se connecter
route.post("/login", loginInputVerif , (req,res)=>{


    // verifier si l'email existe déja
    models.User.findOne({attributes:['id','password','username','role'], where:{email:req.body.email}})
        .then((data)=>{
            if(data){
                const resultat = bcrypt.compareSync(req.body.password, data.password)
                if(resultat){

                    const token = jwt.sign(
                        {"id":data.id, "username":data.username, "role":data.role},
                        process.env.SECTOKEN,
                        {expiresIn:'48h'}
                        )
                    
                    return res.status(201).json({
                        "token":token,
                        "id":data.id, 
                        "username":data.username, 
                        "role": data.role
                    })

                }else{
                    return res.status(403).json({"error":"INVALID PASSWORD"})
                }
                
            }else{
                return res.status(403).json({"error":"EMAIL NOT FOUND"})
            }
        })
        .catch((error)=>{return res.status(500).json(error)})

})

module.exports = route