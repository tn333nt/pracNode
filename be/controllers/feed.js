const { validationResult } = require('express-validator')

const Post = require('../models/post')

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

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const err = new Error('validation failed') // pass data to 'message' field of new err Obj
        err.statusCode = 422
        throw err // not wrap around in async code => auto exit the func and try to reach the next func
    }

    const title = req.body.title
    const content = req.body.content
    const post = new Post({
        title: title,
        content: content,
        creator: { name: 'ABC' },
        imageUrl: 'https://as2.ftcdn.net/jpg/02/29/75/83/220_F_229758328_7x8jwCwjtBMmC6rgFzLFhZoEpLobB6L8.jpg'

    })
    post
        .save()
        .then(postData => {
            res.status(201).json({ // sucessfully created
                post: postData
            })
        })
        .catch(err => { // if new post is failed in data validation
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err) // pass the err to the next err handling exp mw
        });

}
