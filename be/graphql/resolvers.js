// define the logic that is executed for icm queries
const bcryptjs = require('bcryptjs')
const validator = require('validator') // express-validator uses behind the scenes

const User = require('../models/user')

module.exports = {
    abc() {
        return 'lol'
    },
    mutationName(argsObj, req) {
        const email = argsObj.argForResolvers.email
        const password = argsObj.argForResolvers.password
        const name = argsObj.argForResolvers.name

        // validation
        const errors = []
        if (!validator.isEmail(email)) {
            errors.push({ message: 'Invalid email' })
        }
        if (validator.isEmpty(password) ||
            !validator.isLength(password, { min: 5 })
        ) {
            errors.push({ message: 'Password too short' })
        }
        if (errors.length > 0) {
            const err = new Error(errors[0].message)
            err.data = errors
            err.status = 422
            throw err
        }

        return User.findOne({ email }) // only wait for returned V to resolve (in normal func)
            .then(user => {
                if (!user) {
                    throw new Error('existing user')
                }

                return bcryptjs.hash(password, 9)
                    .then(hasedPw => {
                        const user = new User({
                            email, name,
                            password: hasedPw
                        })
                        return user.save()
                    })
                    .then(user => {
                        // return for ReturnedDataAfterMutate
                        return {
                            ...user._doc, // pull out data of doc
                            _id: user._id.toString() // overwrite a field
                        }
                    })
            })
    }
}