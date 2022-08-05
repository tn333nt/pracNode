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

    User.find()
        .then()
}


exports.login = (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    let user

    console.log(email, password, 123)

    User.findOne({ email: email })
        .then(foundUser => {
            if (!foundUser) {
                const err = new Error('no found user w/ this email')
                err.statusCode = 401 // not authenticated
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

            const token = jwt.sign( // sign new jwt from the payload
                { 
                    email: user.email,
                    userId: user._id.toString()
                },
                'privatekey',
                { expiresIn: '1h' } // the token become invalid after 1h
            ) 

            res.status(200).json({token:token, userId: user._id.toString()})

            // 1 chuoi dc ma hoa dc gui kem khi thong tin dang nhap chinhxac
            // luu o phan storage phia user
            // va dc gui di trong tat ca nhung req tiep theo cua user do
            // de xac nhan xem ng dung do la ai co nhung quyen gi
            // and later when decode can use encoded info in it

        })
        .catch(err => next(err)) // network err / some err in the db
}