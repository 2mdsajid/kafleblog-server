// Importing express library and initializing app variable
let express = require('express')
const http = require('http');
let app = express()

// Importing dotenv library to retrieve sensitive information from the .env file
const dotenv = require('dotenv')
dotenv.config({ path: './config.env' })

// Getting the port value from the .env file or defaulting to 5000
const PORT = process.env.PORT || 3001

// Connecting to the MongoDB database
require('./db/mongo')

// Serving static files from the 'public' folder
app.use('/public', express.static('public'));

let cors = require('cors')
app.use(cors());

//before AUTH.JS loading so that it effects
app.use(express.json())

// Linking the noteroute.js file to the main app
app.use(require('./routes/noteroute'))

const server = http.createServer(app);



server.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));
