const express = require('express')
const { body } = require('express-validator')

const router = express.Router()

const feedController = require('../controllers/feed')
const isAuth = require('../middleware/isAuth')


router.get('/posts', [
    body('title').trim().isLength({ min: 5 }),
    body('content').isLength({ min: 5 })
], isAuth, feedController.getPosts)

router.post('/post', isAuth, feedController.postPost)

router.get('/post/:postId', isAuth, feedController.getPost)

router.put('/post/:postId', [
    body('title').trim().isLength({ min: 5 }),
    body('content').isLength({ min: 5 })
], isAuth, feedController.updatePost)

router.delete('/post/:postId', isAuth, feedController.deletePost)


module.exports = router