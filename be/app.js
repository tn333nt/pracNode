const path = require('path');
const fs = require('fs');
const https = require('https'); // HyperText Transfer Protocal Secure

const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const { graphqlHTTP } = require('express-graphql')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')

// use graphql endpoints instead
const schema = require('./graphql/schema')
const resolvers = require('./graphql/resolvers')
const auth = require('./middleware/isAuth')
const clearImage = require('./util/clearImage')

const app = express()

// 1. using environment variables -> flexible in dev & pro
const port = process.env.PORT || 8080
const connectionURL =
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ti4jx.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`

// special ev -> express uses by default to determine the env MODE + helpful in production
console.log(process.env.NODE_ENV)

// 
// Sync = block code exc until the file is read
const privateKey = fs.readFileSync('server.key')
const certificate = fs.readFileSync('server.cert')


// create a write stream -> 
const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'), // define a path from current file to new one in the same folder
    { flags: 'a' } // append new data to file
)

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

// 2. setting SECURE RES HEADERS using Helmet 
// -> reduce the err output details (both default & custom) (esp with a lot of data added to them)
// -> make sure users receive as little info as possible
app.use(helmet())

// 3. compress -> reduce the size of downloading assets -> load files faster (most r supported by hosting provider)
app.use(compression())

// 4. logging request data to passed file -> always know what's going on on server (more organised)
app.use(morgan('combined', { stream: accessLogStream }))
// For a more advanced/ detailed approach on logging (with higher control), see this article: https://blog.risingstack.com/node-js-logging-tutorial/


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
    .then(() => {

// 5. using ssl (/tls - newer version) connection to create custom certificate (for testing)
// install openssl in windows : https://wiki.openssl.org/index.php/Binaries then run :
// openssl req -nodes -new -x509 -keyout server.key -out server.cert
// -> fill values in terminal to create 'server identity' 
// -> get 2 files : cert (-> send to the client) & server key (stay on the server)

        https
            .createServer({
                key: privatekey,
                cert: certificate
            }, // config
                app) // req handler
            .listen(port)

// browser doesn't accept self-signed cert
// advanced -> proceed to localhost
    })
    .catch(err => console.log(err))
