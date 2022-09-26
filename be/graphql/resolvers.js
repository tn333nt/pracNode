// define the logic that is executed for icm queries
const bcryptjs = require('bcryptjs')
const validator = require('validator') // express-validator uses behind the scenes
const jwt = require('jsonwebtoken')

const User = require('../models/user')
const Post = require('../models/post')
const clearImage = require('../util/clearImage')

module.exports = {
    createUser({ userInput }, req) { // or fN: async function() {}
        const email = userInput.email
        const password = userInput.password
        const name = userInput.name

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
    },
    login({ email, password }, req) {
        return User.findOne({ email: email })
            .then(user => {
                if (!user) {
                    const err = new Error('not found user');
                    err.status = 401
                    throw err
                }

                return bcryptjs.compare(password, user.password)
                    .then(isMatched => {
                        if (!isMatched) {
                            const err = new Error('wrong password');
                            err.status = 401
                            throw err
                        }

                        const token = jwt.sign(
                            {
                                userId: user._id.toString()
                            },
                            'privatekey',
                            { expiresIn: '1h' })

                        return { token, userId: user._id.toString() }
                    })
            })
    },
    createPost({ postInput }, req) {
        if (!req.isAuth) {
            const err = new Error('not authenticated')
            err.status = 401
            throw err
        }

        const title = postInput.title
        const content = postInput.content
        const imageUrl = postInput.imageUrl

        const errors = []

        if (validator.isEmpty(title) ||
            !validator.isLength(title, { min: 5 })
        ) {
            errors.push({ message: 'title too short' })
        }
        if (validator.isEmpty(content) ||
            !validator.isLength(content, { min: 5 })
        ) {
            errors.push({ message: 'content too short' })
        }

        if (errors.length > 0) {
            const err = new Error(errors[0].message)
            err.data = errors
            err.status = 422
            throw err
        }

        // extract user data from the auth token
        return User.findById(req.userId)
            .then(creator => {
                const post = new Post({ title, content, imageUrl, creator })

                // add post to user's posts
                creator.posts.push(post)
                return creator.save()
                    .then(() => {
                        // save post after add
                        return post.save()
                            .then(postData => {
                                return {
                                    ...postData,
                                    _id: postData._id.toString(),
                                    createdAt: postData.createdAt.toIOString(),
                                    updatedAt: postData.updatedAt.toIOString(),
                                }
                            })
                    })

            })
    },
    getPosts({ page }, req) {
        if (!req.isAuth) {
            const err = new Error('not authenticated')
            err.status = 401
            throw err
        }

        if (!page) {
            page = 1
        }
        const perPage = 2

        return Post.find()
            .countDocuments()
            .then(totalItems => {
                return Post.find()
                    .sort({ createdAt: -1 })
                    .populate('creator', 'name') // restrict data & secure hashedPw of post owners
                    .skip((page - 1) * perPage)
                    .limit(perPage)
                    .then(posts => {
                        return posts.map(p => {
                            return {
                                ...p,
                                _id: p._id.toString(),
                                createdAt: p.createdAt.toIOString(),
                                updatedAt: p.updatedAt.toIOString()
                            }
                        })
                    })
                    .then(posts => {
                        return {
                            // posts: posts.map(p => {
                            //     return {
                            //         ...p,
                            //         _id: p._id.toString(),
                            //         createdAt: p.createdAt.toIOString(),
                            //         updatedAt: p.updatedAt.toIOString()
                            //     }
                            // }),
                            posts: posts,
                            totalItems: totalItems
                        }
                    })
            })

    },
    getPost({ postId }, req) {
        if (!req.isAuth) {
            const err = new Error('not authenticated')
            err.status = 401
            throw err
        }

        return Post.findById(postId)
            .populate('creator')
            .then(post => {
                if (!post) {
                    const err = new Error('No post found')
                    err.statusCode = 404
                    throw err
                }

                return {
                    ...post._doc,
                    _id: post._id.toString(),
                    createdAt: post.createdAt.toIOString(),
                    updatedAt: post.updatedAt.toIOString()
                }
            })
    },
    updatePost({ postId, postInput }, req) {
        if (!req.isAuth) {
            const err = new Error('not authenticated')
            err.status = 401
            throw err
        }

        const title = postInput.title
        const content = postInput.content
        const imageUrl = postInput.imageUrl
        const errors = []

        if (validator.isEmpty(title) ||
            !validator.isLength(title, { min: 5 })
        ) {
            errors.push({ message: 'title too short' })
        }
        if (validator.isEmpty(content) ||
            !validator.isLength(content, { min: 5 })
        ) {
            errors.push({ message: 'content too short' })
        }

        if (errors.length > 0) {
            const err = new Error(errors[0].message)
            err.data = errors
            err.status = 422
            throw err
        }

        return Post.findById(postId)
            .populate('creator')
            .then(post => {
                if (!post) {
                    const err = new Error('No post found')
                    err.statusCode = 404
                    throw err
                }

                // check if this user is an creator
                if (post.creator._id.toString() !== req.userId.toString()) {
                    const err = new Error('not authorised')
                    err.status = 403
                    throw err
                }

                post.title = postInput.title
                post.content = postInput.content

                // only if having data for new img -> update
                if (postInput.imageUrl === undefined) {
                    post.imageUrl = postInput.imageUrl
                }
                

                return post.save()
                    .then(post => {
                        return {
                            ...post._doc,
                            _id: post._id.toString(),
                            createdAt: post.createdAt.toIOString(),
                            updatedAt: post.updatedAt.toIOString()
                        }
                    })
            })
    },
    deletePost({ postId }, req) {
        if (!req.isAuth) {
            const err = new Error('not authenticated')
            err.status = 401
            throw err
        }

        return Post.findById(postId) // verify whether that user created the post before deleting it
            .then(post => {
                if (!post) {
                    const err = new Error('No post found')
                    err.statusCode = 404
                    throw err
                }

                if (post.creator._id.toString() !== req.userId.toString()) {
                    const err = new Error('not authorised')
                    err.status = 403
                    throw err
                }

                clearImage(post.imageUrl)

                return Post.findByIdAndRemove(postId)
                .then(() => {
                    User.findById(req.userId)
                        .then(user => {
                            // 
                            user.posts.pull(postId)
                            return user.save()
                        })
                        .then(() => true)

                })


            })

    },
}