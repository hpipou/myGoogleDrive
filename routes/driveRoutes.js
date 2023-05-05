const express = require("express")
const route = express.Router()
const tokenVerification = require("../middleware/tokenVerification")
const fs = require('fs');
const path = require('path');
const jwt = require("jsonwebtoken")
const multer = require("../middleware/multer")
const multerErrorHendler = require("../middleware/multerErrorCapture")
const models = require("../models")
const validator = require("validator")
const archiver = require('archiver');
require("dotenv").config()

// Définir la capacité de stockage max pour chaque utilisateur en Mo
const driveSize = process.env.SPACESIZE

//////////////////////////////////////////////////////////////////////
// afficher la liste des documents 
//////////////////////////////////////////////////////////////////////
route.get("", tokenVerification, (req,res)=>{

    const token = req.headers.authorization.split(" ")[1]
    const tokenDecoded = jwt.decode(token)

    const dirPath = path.join(__dirname,'..' , process.env.FOLDERDRIVE , tokenDecoded.id);

    fs.readdir(dirPath, function(err, files) {
        if (err) {
          return console.error(err);
        }
        let totalSize = 0;
        let listFile = []
        let sizeFile = []

        files.forEach(function(file) {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          const fileSize = stats.size;
          totalSize += fileSize/1000000;
          
          listFile.push(file)
          sizeFile.push(fileSize/1000000)
        });
    
        return res.json({"fileName": listFile, "sizeFile":sizeFile, "totalSize":totalSize});
      });
})

//////////////////////////////////////////////////////////////////////
// ajouter un fichier
//////////////////////////////////////////////////////////////////////
route.post("", tokenVerification, multer.single('file'), multerErrorHendler, (req,res)=>{
    
    // convertir la taille du fichier de bytes vers Mo
    const fileSizeReq = req.file.size/1000000

    const token = req.headers.authorization.split(" ")[1]
    const tokenDecoded = jwt.decode(token)

    // confirmer que le compte existe, et vérifier l'espace restant
    models.User.findOne({attributes:['freeSpace','usedSpace'] , where:{id:tokenDecoded.id}})
    .then((data)=>{

        if(data){

            const newUsedSpace = data.usedSpace + fileSizeReq
            const newFreeSpace = data.freeSpace - fileSizeReq
            
            if(newUsedSpace>driveSize){

                const dirPath = path.join(__dirname,'..' , process.env.FOLDERDRIVE , tokenDecoded.id, req.myName );
                fs.unlinkSync(dirPath)

                return res.status(403).json({
                                             "error":"NO MORE SPACE", 
                                             "freeSpace": data.freeSpace,
                                             "fileSize": fileSizeReq
                                            })
            }else{
                editUser(newUsedSpace, newFreeSpace)
            }

        }else{
            return res.status(403).json({"error":"USER NOT FOUND"})
        }

    })
    .catch((error)=>{return res.status(500).json(error)})

    // modifier 'freeSpace','usedSpace' dans la table USER
    function editUser(newUsedSpace, newFreeSpace){
        models.User.update({
            freeSpace:newFreeSpace,
            usedSpace:newUsedSpace
        },{where:{id:tokenDecoded.id}})
        .then(()=>{return res.status(201).json({
                                                "success":"FILE UPLOADED",
                                                "freeSpace":newFreeSpace,
                                                "usedSpace":newUsedSpace
                                            })})
        .catch((error)=>{return res.status(505).json(error)})
    }

})


//////////////////////////////////////////////////////////////////////
// supprimer un fichier
//////////////////////////////////////////////////////////////////////
route.delete("", tokenVerification, (req,res)=>{
    
    if(req.body.fileName==null || req.body.fileName==undefined)
        {return res.status(404).json({"error":"IMAGE FILENAME UNDEFINED"})}

    const fileNameBody = req.body.fileName

    if(validator.isEmpty(fileNameBody))
        {return res.status(404).json({"error":"IMAGE NAME EMPTY"})}

    const token = req.headers.authorization.split(" ")[1]
    const tokenDecoded = jwt.decode(token)

    const dirPath = path.join(__dirname,'..' , process.env.FOLDERDRIVE , tokenDecoded.id, fileNameBody );

    // vérifier si le fichier existe
    if (fs.existsSync(dirPath)) {

        // afficher la taille du fichier
        const maSize = fs.statSync( dirPath ).size/1000000
    
        // supprimer le fichier
        fs.unlinkSync(dirPath)

        // mettre à jours les données de stockage
        statsSpacing(maSize)
        
    }else{
        return res.status(403).json({"error":"FILE NOT FOUND"})
    }
    
    

    // confirmer que le compte existe, et vérifier l'espace restant
    function statsSpacing(maSize){
        
        models.User.findOne({attributes:['freeSpace','usedSpace'] , where:{id:tokenDecoded.id}})
        .then((data)=>{

            if(data){

                const newUsedSpace = data.usedSpace + maSize
                const newFreeSpace = data.freeSpace - maSize
                editUser(newUsedSpace, newFreeSpace)
                
            }else{
                return res.status(403).json({"error":"USER NOT FOUND"})
            }

        })
        .catch((error)=>{return res.status(500).json(error)})
    }

    // modifier 'freeSpace','usedSpace' dans la table USER
    function editUser(newUsedSpace, newFreeSpace){
        models.User.update({
            freeSpace:newFreeSpace,
            usedSpace:newUsedSpace
        },{where:{id:tokenDecoded.id}})
        .then(()=>{
            return res.status(201).json({
                                            "success":"FILE DELETED",
                                            "useSpace": newUsedSpace,
                                            "freeSace": newFreeSpace
                                        })})
        .catch((error)=>{return res.status(505).json(error)})
    }

})


//////////////////////////////////////////////////////////////////////
// Télécharger un seul fichier
//////////////////////////////////////////////////////////////////////
route.get("/file", tokenVerification, (req,res)=>{

    if(req.body.fileName==null || req.body.fileName==undefined)
        {return res.status(404).json({"error":"IMAGE FILENAME UNDEFINED"})}

    const fileNameBody = req.body.fileName

    if(validator.isEmpty(fileNameBody))
        {return res.status(404).json({"error":"IMAGE NAME EMPTY"})}

    const token = req.headers.authorization.split(" ")[1]
    const tokenDecoded = jwt.decode(token)

    const dirPath = path.join(__dirname,'..' , process.env.FOLDERDRIVE , tokenDecoded.id, fileNameBody );

    // vérifier si le fichier existe
    if (fs.existsSync(dirPath)) {

        // Récupérer le type de fichier
        const fileType = fileNameBody.split('.').pop();

        // Définir les entêtes HTTP pour le téléchargement
        res.setHeader('Content-disposition', `attachment; filename=${fileNameBody}`);
        res.setHeader('Content-type', `application/${fileType}`);

        // Lire le contenu du fichier et le transmettre au client
        const fileStream = fs.createReadStream(dirPath);
        fileStream.pipe(res);
        
    }else{
        return res.status(403).json({"error":"FILE NOT FOUND"})
    }
})

//////////////////////////////////////////////////////////////////////
// Télécharger plusieurs fichiers
//////////////////////////////////////////////////////////////////////
route.get("/files", tokenVerification, (req,res)=>{

    if(req.body.fileName==null || req.body.fileName==undefined)
        {return res.status(404).json({"error":"IMAGE FILENAME UNDEFINED"})}

    const fileNameBody =  req.body.fileName

    try{
        if (fileNameBody.length == 0) {
            return res.status(404).json({"error":"IMAGE NAME EMPTY"})
        }
    }catch{
        return res.status(404).json({"error":"IMAGE NAME IS NOT ARRAY"})
    }

    const token = req.headers.authorization.split(" ")[1]
    const tokenDecoded = jwt.decode(token)

    // créer une archive ZIP
    // Définir le nom et le chemin du fichier ZIP à créer
    const zipName = tokenDecoded.username + '.zip';
    const zipPath = path.join(__dirname,'..' ,'archivezip', zipName )

    // Créer une instance d'archiver et spécifier le type de fichier à créer
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Créer un flux de sortie pour écrire le fichier ZIP
    const output = fs.createWriteStream(zipPath);

    try{
            // Événement 'close' déclenché lorsque la création du fichier ZIP est terminée
            output.on('close', () => {});

            // Événement 'error' déclenché en cas d'erreur
            output.on('error', (err) => { throw err; });

    }catch{
        return res.status(403).json({"error": "ERROR ON CREATE ZIP FILE"})
    }
    
    var dirPath
 
    // vérifier si les fichiers existent
    fileNameBody.forEach(element =>{ 
        
        dirPath = path.join(__dirname,'..' , process.env.FOLDERDRIVE , tokenDecoded.id, element );
        // vérifier si le fichier existe
        if (fs.existsSync(dirPath)) {
            // FILE EXIST
            archive.file(dirPath, { name: element });
        }else{
            return res.status(403).json({"error": "THIS FILE " + element + " IS NOT FOUND"})
        }
    
    });

    // Finaliser la création du fichier ZIP
    archive.pipe(output);
    archive.finalize();

    const zipFileName = tokenDecoded.username + '.zip'

    // Définir les entêtes HTTP pour le téléchargement
    res.setHeader('Content-disposition', `attachment; filename=${zipFileName}`);
    res.setHeader('Content-type', `application/zip`);

    // planifier la suppression du fichier après 3 minutes de sa génération
    setTimeout(() => { fs.unlinkSync(zipPath) }, process.env.DELETEIN);

    // Lire le contenu du fichier et le transmettre au client
    const fileStream = fs.createReadStream(dirPath);
    fileStream.pipe(res);

})

module.exports = route