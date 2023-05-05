const multer = require('multer')

const errCaptureFromMulter=(err, req, res, next)=>{

    if(err instanceof multer.MulterError)
    {return res.status(403).json("Le fichier ne doit pas dépasser 10 Mo")}
    else{
        return res.status(403).json("Fichiers accepté : JPG / JPEG / PNG")
    }
    
}

module.exports=errCaptureFromMulter