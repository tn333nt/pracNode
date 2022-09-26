const jwt = require('jsonwebtoken')

// validate icm tokens

module.exports = (req, res, next) => {
    // extract the token from icm req
    const authHeader = req.get('Authorization') // get data from headers    
    if (!authHeader) {
        req.isAuth = false
        return next() // continue to the next mw
    }

    const token = authHeader.split(' ')[1]
    let decodedToken

    try {
        decodedToken = jwt.verify(token, 'privatekey') // both decode & verify the token
    } catch {
        req.isAuth = false
        return next()
    }

    if (!decodedToken) {
        req.isAuth = false
        return next()
    }

    // store userId in the req to pass to next middlewares (to identify user)\
    req.userId = decodedToken.userId
    req.isAuth = true
    next()

    // then decide auth in resolvers
}