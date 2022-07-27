
exports.getPosts = (req, res, next) => {
    res.status(200).json({ // success
        posts: [{ title: 123, content: 'abc' }]
    })
}

exports.postPost = (req, res, next) => {
    const title = req.body.title
    const content = req.body.content

    res.status(201).json({ // sucessfully created
        post : { id: Math.random(), title: title, content: content }
    })
}
