const express = require('express')
const mongoose = require('mongoose')

const feedRoutes = require('./routes/feed')

const app = express()
const port = 8080
const connectionURL = 'mongodb+srv://test:bJYVI29LEAjl147U@cluster0.ti4jx.mongodb.net/message'

app.use(express.json())

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

