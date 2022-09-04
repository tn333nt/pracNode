const fs = require('fs')
const path = require('path')

const { validationResult } = require('express-validator')

const io = require('../socket')
const Post = require('../models/post')
const User = require('../models/user')

exports.getPosts = (req, res, next) => {

    const currentPage = req.query.page || 1
    const perPage = 3
    let totalItems

    Post
        .find().countDocuments()
        .then(count => {
            totalItems = count
            return Post.find()
                .populate('creator') // fetch full ref obj for that creator
                .sort({ createdAt: -1 }) // sort desc for be data
                .skip((currentPage - 1) * perPage) // skip number of items in prev page
                .limit(perPage) // limit number of items in 1 page
        })
        .then(posts => {
            res.status(200).json({
                posts: posts,
                totalItems: totalItems
            })
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
    const imageUrl = req.file.path.replace("\\", "/") // path to the file that was store on this server

    const post = new Post({
        title: title,
        content: content,
        creator: req.userId,
        imageUrl: imageUrl
    })

    let postData
    let userData

    post
        .save()
        .then(data => {
            postData = data
            return User
                .findById(req.userId)
                .then(user => {
                    user.posts.push(post)
                    user.save()
                })
        })
        .then(() => {
            // send a msg to all connected users
            // broadcast() -> to all users except the one was sent req
            io.getIO().emit('eventName', {
                action: 'create',
                post: {
                    ...postData._doc, // https://stackoverflow.com/a/53895822
                    creator: {
                        _id: userData._id,
                        name: userData.name
                    }
                }
            })

            // return api
            res.status(201).json({
                post: postData,
                creator: {
                    _id: userData._id,
                    name: userData.name
                }
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


exports.updatePost = (req, res, next) => {
    const postId = req.params.postId

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const err = new Error('validation failed')
        err.statusCode = 422
        throw err
    }

    const title = req.body.title
    const content = req.body.content
    let imageUrl = req.body.imageUrl

    if (req.file) {
        imageUrl = req.file.path
    }

    if (!imageUrl) {
        const err = new Error('no file picked')
        err.status = 422
        throw err
    }

    // valid data
    Post.findById(postId)
        .populate('creator')
        .then(post => {
            if (!post) {
                const err = new Error('No post found')
                err.statusCode = 404
                throw err
            }

            if (post.creator._id.toString() !== req.userId) {
                const err = new Error('Not authorised')
                err.statusCode = 403
                throw err
            }

            if (imageUrl !== post.imageUrl) { // if pick new img
                clearImage(post.imageUrl)
            }

            post.title = title
            post.content = content
            post.imageUrl = imageUrl
            return post.save()
        })
        .then(updatedPost => {
            io.getIO().emit('eventName', {
                action: 'update',
                post: updatedPost
            })

            res.status(200).json({ post: updatedPost })
        })
        .catch(err => next(err))
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId

    Post.findById(postId) // verify whether that user created the post before deleting it
        .then(post => {
            if (!post) {
                const err = new Error('No post found')
                err.statusCode = 404
                throw err
            }

            clearImage(post.imageUrl)
            Post.findByIdAndRemove(postId)

            return User.findById(req.userId)

        })
        .then(user => {
            user.posts.pull(postId)
            user.save()
            io.getIO().emit('eventName', {
                action: 'delete',
                postId: postId
            })
            res.status(200).json({})
        })
        .catch(err => next(err))

}


const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath)
    fs.unlink(filePath, err => console.log(err))
}
