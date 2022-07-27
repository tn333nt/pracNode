const express = require('express')

const feedRoutes = require('./routes/feed')

const app = express() 
const port = 8080

app.use(express.json()) 

app.use((req, res, next) => {
    res.setHeader('access-control-allow-origin', '*'); // allow access from any domain 
    res.setHeader('access-control-allow_methods', 'get, post'); // allow specific http methods from these origins
    res.setHeader('access-control-allow-headers', 'content-type , authorization'); // allow extra data in the req header
    next()
})

app.use(feedRoutes)

app.listen(port)
