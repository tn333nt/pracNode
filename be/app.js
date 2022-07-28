const path = require('path');

const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')

const feedRoutes = require('./routes/feed')

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

app.use('/images', express.static(path.join(__dirname, 'images'))) // construct a path to images folder & serve it 

app.use((req, res, next) => {
    res.setHeader('access-control-allow-origin', '*'); // allow access from any domain 
    res.setHeader('access-control-allow_methods', 'get, post'); // allow specific http methods from these origins
    res.setHeader('access-control-allow-headers', 'content-type , authorization'); // allow extra data in the req header
    next()
})

app.use(feedRoutes)

app.use((err, req, res, next) => {
    console.log(err);
    const status = err.statusCode || 500
    const msg = err.message
    res.status(status).json({ message: msg })
})

mongoose
    .connect(connectionURL)
    .then(() => app.listen(port))
    .catch(err => console.log(err))

