const fs = require('fs')
const path = require('path')

const { validationResult } = require('express-validator')

const Post = require('../models/post')

exports.getPosts = (req, res, next) => {

    const currentPage = req.query.page || 1
    const perPage = 3
    let totalItems

    Post.find()
        .countDocuments()
        .then(count => {
            totalItems = count
            return Post.find()
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

    if (!imageUrl) { // le ra la keep file moi dung
        const err = new Error('no file picked')
        err.status = 422
        throw err
    }

    // valid data
    Post.findById(postId)
        .then(post => {
            console.log(post, 44321432141)
            if (!post) {
                const err = new Error('No post found')
                err.statusCode = 404
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
            console.log(updatedPost, 0987654321)
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
            return Post.findByIdAndRemove(postId)
        })
        .catch(err => next(err))

    // Post.findByIdAndRemove(postId, {})
}


const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath)
    fs.unlink(filePath, err => console.log(err))
}
