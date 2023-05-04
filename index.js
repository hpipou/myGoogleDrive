const express = require("express")
const app = express()

// body parser et cors
const bodyParser = require("body-parser")
const cors = require("cors")
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(cors())

// importer les routes
const userRoutes = require("./routes/userRoutes")
const driveRoutes = require("./routes/driveRoutes")
app.use("/user", userRoutes)
app.use("/drive", driveRoutes)

// lancer l'application
app.listen(3000, ()=>console.log("SERVER START ON PORT 3000"))



