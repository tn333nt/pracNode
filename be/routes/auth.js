const express = require('express')
const { body } = require('express-validator')

const User = require('../models/user')
const authController = require('../controllers/auth')

const router = express.Router()

router.put('/signup', [
    body('email')
        .isEmail()
        .withMessage('enter email lol')
        .normalizeEmail()
        .custom(async (value, { req }) => {
            const user = await User.findOne({ email: value })
            if (user) {
                return Promise.reject('e-mail address already exists')
            }
        })
    , body('password')
        .trim()
        .isLength({min:5})
    , body('name')
        .trim()
        .not().isEmpty()
], authController.signup)

router.post('/login', authController.login) // validate outside anyway

module.exports = router