// for sharing io instance across files 
let ioObj

module.exports = {
    // define a func thorugh key-value pair
    init: httpServer => {
        // pass the created server to the executed func that returned by socket.io
        ioObj = require('socket.io')(httpServer); 
        return ioObj 
    },
    getIO: () => {
        if (!ioObj) {
            throw new Error('Socket.io is not initialized')
        }
        return ioObj
    }
}