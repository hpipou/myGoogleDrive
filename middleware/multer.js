const multer = require ('multer')
const path= require('path')
const jwt = require("jsonwebtoken")

const fileStorage= multer.diskStorage({
    destination:(req,file,callback)=>{
        const token = req.headers.authorization.split(" ")[1]
        const tokenDecoded = jwt.decode(token)
        const stockageIMG= path.join('datadrive', tokenDecoded.id)
        callback(null, stockageIMG)
    },
    filename:(req,file,callback)=>{
        const extension= file.mimetype.split('/')[1]
        const fileNameFinale= Date.now() + '_' + Math.round(Math.random() * 1E15) + '.' + extension
        // transmettre le nom du fichier au middleware suivant :
        req.myName = fileNameFinale
        callback(null,fileNameFinale)
    }
})

const upload=multer({storage:fileStorage, 
                     limits:{fileSize:1000000},
                     fileFilter:(req,file,callback)=>{
                        if(
                            path.extname(file.originalname)=='.png' || 
                            path.extname(file.originalname)=='.jpg' || 
                            path.extname(file.originalname)=='.jpeg'||
                            path.extname(file.originalname)=='.pdf' ||
                            path.extname(file.originalname)=='.mp3' ||
                            path.extname(file.originalname)=='.zip' ||
                            path.extname(file.originalname)=='.docx'||
                            path.extname(file.originalname)=='.xlsx'||
                            path.extname(file.originalname)=='.mp4 '||
                            path.extname(file.originalname)=='.txt'
                            
                           ){callback(null, true)}
                        else{callback(new Error("Fichier non supproté"))}
                     }})

module.exports=upload