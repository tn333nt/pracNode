const fs = require('fs')
const path = require('path')

// clear old img after upload new
const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath)
    fs.unlink(filePath, err => console.log(err))
}

module.exports = clearImage