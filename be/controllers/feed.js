const { validationResult } = require('express-validator')

const Post = require('../models/post')

exports.getPosts = (req, res, next) => {
    Post.find()
        .then(posts => {
            res.status(200).json({ posts: posts })
        })
        .catch(err => next(err))
}

exports.postPost = (req, res, next) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const err = new Error('validation failed') // pass data to 'message' field of new err Obj
        err.statusCode = 422
        throw err // not wrap around in async code => auto exit the func and try to reach the next func
    }

    if (!req.file) {
        const err = new Error('no image provided')
        err.statusCode = 422
        throw err
    }

    const title = req.body.title
    const content = req.body.content
    const imageUrl = req.file.path.replace("\\" ,"/") // path to the file that was store on this server

    const post = new Post({
        title: title,
        content: content,
        creator: { name: 'ABC' },
        imageUrl: imageUrl

    })
    post
        .save()
        .then(postData => {
            console.log(postData, 'post post')
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

exports.getPost = (req, res, next) => {
    const postId = req.params.postId

    Post.findById(postId)
        .then(post => {
            if (!post) {
                const err = new Error('No post found')
                err.statusCode = 404
                throw err // reach to next catch block then next(err) finally
            }

            res.status(200).json({ post: post })
        })
        .catch(err => next(err))
}