const path = require('path');

const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')

const feedRoutes = require('./routes/feed')
const authRoutes = require('./routes/auth')

const app = express()
const port = 8080
const connectionURL = 'mongodb+srv://test:bJYVI29LEAjl147U@cluster0.ti4jx.mongodb.net/message'

const fileStorage = multer.diskStorage({ // config where the file get stored
    destination: (req, file, callback) => {
        callback(null, 'images')
    },
    filename: (req, file, callback) => {
        callback(null, uuidv4())
    }
})

const fileFilter = (req, file, callback) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        callback(null, true);
    } else {
        callback(null, false);
    }
}

app.use(express.json())

app.use(multer({
    storage: fileStorage,
    fileFilter: fileFilter
}).single('image'))

app.use('/images', express.static(path.join(__dirname, 'images'))) // serve img 

app.use((req, res, next) => {
    res.setHeader('access-control-allow-origin', '*'); // allow access from any domain 
    res.setHeader('access-control-allow-methods', '*'); // allow specific http methods from these origins
    res.setHeader('access-control-allow-headers', '*'); // allow extra data in the req header
    next()
})

// set up routes for http req 
app.use(authRoutes)
app.use(feedRoutes)

app.use((err, req, res, next) => {
    console.log(err);
    const status = err.statusCode || 500
    const msg = err.message
    const data = err.data
    res.status(status).json({ message: msg , error : data})
})

mongoose
    .connect(connectionURL)
    .then(() => {
        const newNodeServer = app.listen(port) 
        // use http server to establish web socket connection
        const io = require('./socket').init(newNodeServer)

        // execute for every new client that connects
        io.on('connection', socket => {
            console.log(socket, 'socket/connectedClient/connection ?')
        })
    })
    .catch(err => console.log(err))

