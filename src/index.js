const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => { // {socket} contains new 'connection' info
  // fires each time a new connection is established
  console.log('new websocket connnection')

  // handle join event and room creation:
  socket.on('join', (options, callback) => {
    // adds a 'acknowledgement'/callback() to handle errors for 'addUser()'

    // add new User
    const { error, user } = addUser({ id: socket.id, ...options })
    // call addUser, destructure either the error or user that gets returned

    // if error send back to client using acknowledgement (callback)
    if (error) return callback(error)

    // code below runs only when a user is successfully added an no errors are present:

    // join specific room by name:
    socket.join(user.room) // 'socket.join' can only be used on the server

    // emit welcome message to new client -- when connection is established:
    socket.emit('message', generateMessage('Admin', 'Welcome!'))

    // broadcast message to all other users - in current room - when a new user joins
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined ${user.room}`))

    // emit event to client whenever user list adds a new user:
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback() // acknowledgement for 'join' event, ends operation
  })

  socket.on('sendMessage', (message, callback) => {
    // find user and access user data:
    const user = getUser(socket.id)
    // console.log('send message from: ', user)

    // on sendMessage event (from client):
    console.log('message sent back to server', message)
    // setup profanity filter for user input message:
    const filter = new Filter()
    // use filter to validate message for profanity:
    if (filter.isProfane(message)) {
      // if profane text found:
      return callback('Profanity is not allowed')
    }

    // emit messages only to users in the current room -- using user.room
    io.to(user.room).emit('message', generateMessage(user.username, message))

    callback()
  })



  socket.on('sendLocation', (coords, callback) => {
    // passes in a callback used to fire off the proper acknowledgement

    // find user and access user data:
    const user = getUser(socket.id)
    // console.log('send message from: ', user)

    // send location to all clients -- as locationMessage event -- only in current room
    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
    // emit message generated with utility

    callback() // triggers disconnect acknowledgement
  })

  socket.on('disconnect', () => { // fires when a connection is closed - triggered by callback()

    // handle remove user, when a user disconnects:
    const user = removeUser(socket.id)
    // console.log('removed user: ', user)

    if (user) {
      // emits a message to all connected clients -- only in the same room as user using "io.to()"
      io.to(user.room).emit('message', generateMessage('Admin', `A ${user.username} has left ${user.room}`))

      // emits event to remove user from list when they leave a room:
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })

    }
  })

})

server.listen(port, () => {
  console.log('Server is up on port: ' + port)
})
