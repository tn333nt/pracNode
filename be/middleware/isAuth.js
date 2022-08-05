const jwt = require('jsonwebtoken')

// validate icm tokens

module.exports = (req, res, next) => {
    // extract the token from icm req
    const authHeader = req.get('Authorization') // get data from headers    
    if (!authHeader) {
        const err = new Error('Invalid authorization header')
        err.statusCode = 401
        throw err
    }

    const token = authHeader.split(' ')[1]
    let decodedToken

    try {
        decodedToken = jwt.verify(token, 'privatekey') // both decode & verify the token
    } catch {
        err.statusCode = 500
        throw err
    }

    if (!decodedToken) {
        const err = new Error('unable to verify the token')
        err.statusCode = 401
        throw err
    }

    // store userId in the req to pass to next middlewares (to identify user)\
    req.userId = decodedToken.userId

}