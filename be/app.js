const path = require('path');

const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const { graphqlHTTP } = require('express-graphql')

// use graphql endpoints instead
const schema = require('./graphql/schema')
const resolvers = require('./graphql/resolvers')
const auth = require('./middleware/isAuth')
const clearImage = require('./util/clearImage')

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
    if (res.method !== 'POST') {
        return res.sendStatus(200) // temp solution : return before reach exp-gql
    }
    next()
})

// run on every req that reaches to gql endpoint
app.use(auth)

// upload file
app.put('postImg', (req, res, next) => {
    if (!req.isAuth) {
        const err = new Error('not authenticated')
        err.status = 401
        throw err
    }

    if (!req.file) {
        return res.status(200).json({ message: 'no file provided' })
    }

    if (req.body.oldImage) {
        clearImage(req.body.oldImage)
    }

    return res.status(201).json({ filePath: req.file.path }) 
})

// 
app.use('/graphql', graphqlHTTP({
    schema,
    rootValue: resolvers,
    graphiql: true, // GET req to get graphiql interface

    // handle err
    customFormatErrorFn(err) {
        if (!err.originalError) { // detected thrown err
            return err
        }
        const data = err.originalError.data
        const message = err.message || 'an error occurred'
        const status = err.originalError.status || 500
        return { data, message, status }
    }
}))

app.use((err, req, res, next) => {
    console.log(err);
    const status = err.statusCode || 500
    const msg = err.message
    const data = err.data
    res.status(status).json({ message: msg, error: data })
})

mongoose
    .connect(connectionURL)
    .then(() => app.listen(port))
    .catch(err => console.log(err))

