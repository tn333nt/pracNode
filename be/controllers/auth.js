const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken') // to create new jwt conveniently

const User = require('../models/user')

exports.signup = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const err = new Error('validation failed')
        err.statusCode = 422
        err.data = errors.array() // keep the original err
        throw err
    }

    const email = req.body.email
    const password = req.body.password
    const name = req.body.name

    // save user with the hased pass
    bcrypt
        .hash(password, 12)
        .then(hashedPw => {
            const user = new User({
                email: email,
                password: hashedPw,
                name: name
            })
            return user.save()
        })
        .then(user => {
            res.status(201).json({ userId: user._id })
        })
        .catch(err => next(err))

}


exports.login = (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    let user

    User.findOne({ email: email })
        .then(foundUser => {
            if (!foundUser) {
                const err = new Error('not found user with this email')
                err.statusCode = 401 
                throw err
            }
            user = foundUser
            return bcrypt.compare(password, foundUser.password)
        })
        .then(isCompared => {
            if (!isCompared) {
                const err = new Error('wrong password')
                err.statusCode = 401
                throw err
            }

            // gen Json Web Token if user entered valid credentials
            const token = jwt.sign( 
                { 
                    email: user.email,
                    userId: user._id.toString()
                },
                'privatekey',
                { expiresIn: '1h' } 
            ) 

            res.status(200).json({token:token, userId: user._id.toString()})

        })
        .catch(err => next(err)) // errs with db (network/...)
}
