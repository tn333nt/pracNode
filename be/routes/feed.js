const express = require('express')
const { body } = require('express-validator')

const router = express.Router()

const feedController = require('../controllers/feed')

router.get('/posts', [
    body('title').trim().isLength({min:5}),
    body('content').isLength({min:5})
], feedController.getPosts)

router.post('/post', feedController.postPost)

router.get('/post/:postId', feedController.getPost)

router.put('/post/:postId', [
    body('title').trim().isLength({min:5}),
    body('content').isLength({min:5})
], feedController.updatePost)

router.delete('/post/:postId', feedController.deletePost)


module.exports = router