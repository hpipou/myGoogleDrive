const express = require("express")
const app = express()

// body parser et cors
const bodyParser = require("body-parser")
const cors = require("cors")
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(cors())

// protéger l'application en configurant divers en-têtes HTTP
const helmet = require("helmet");
app.use(helmet());

// limiter le nombre de requêtes que les clients peuvent envoyer à l'API
const rateLimit = require('express-rate-limit')
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})
app.use(limiter)

// importer les routes
const userRoutes = require("./routes/userRoutes")
const driveRoutes = require("./routes/driveRoutes")
app.use("/user", userRoutes)
app.use("/drive", driveRoutes)

// lancer l'application
app.listen(3000, ()=>console.log("SERVER START ON PORT 3000"))



