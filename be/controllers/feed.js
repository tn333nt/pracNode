
const { validationResult } = require('express-validator')

exports.getPosts = (req, res, next) => {
    res.status(200).json({ // success
        posts: [{
            _id: '0',
            title: 'title',
            content: 'content',
            creator: {
                name: 'ABC'
            },
            imageUrl: 'https://as2.ftcdn.net/jpg/02/29/75/83/220_F_229758328_7x8jwCwjtBMmC6rgFzLFhZoEpLobB6L8.jpg',
            createdAt: new Date()
        }]
    })
}

exports.postPost = (req, res, next) => {
    const title = req.body.title
    const content = req.body.content

    const errors = validationResult(req) // validation results get from request

    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'validation failed',
            errors: errors.array()
        })
    }

    res.status(201).json({ // sucessfully created
        post: {
            _id: Math.random(),
            title: title,
            content: content,
            creator: {
                name: 'ABC'
            },
            createdAt: new Date()
        }
    })
}
