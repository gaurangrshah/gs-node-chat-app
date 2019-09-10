const users = []

const addUser = ({ id, username, room }) => {
  // Clean the data:
  username = username.trim().toLowerCase()
  room = room.trim().toLowerCase()

  // Validate the data
  if (!username || !room) return { error: 'Username and room are required' }

  // Check for existing user
  const existingUser = users.find((user) => {
    // make sure that there is no other user with the same name in this room.
    return user.room === room && user.username === username
    // will return true if either condition is met, triggers error below
  })

  // Validate username
  if (existingUser) return { error: 'Username is in use!' }

  // Store User
  const user = { id, username, room }
  users.push(user)
  return { user }
}

const removeUser = (id) => {
  // find user with matching id by index
  const index = users.findIndex((user) => user.id === id)
  // if no match: index = -1 // if match found: index = 0 | 1
  if (index !== -1) {
    // if match found (as long as index is not equal to -1)
    console.log('executing removeUser:', users.splice(index, 1)[0])
    // remove the user from the users array using the 'index' value
    return users.splice(index, 1)[0]
  }
}

const getUser = (id) => {
  return users.find((user) => {
    // return user with matching id:
    return user.id === id
  })
}

const getUsersInRoom = (room) => {
  // find users in matching room by room name:
  return users.filter((user) => user.room === room)
}



// // test functions -- populate dummy users:
// addUser({
//   id: 22,
//   username: 'Tom',
//   room: 'room2'
// })

// addUser({
//   id: 33,
//   username: 'Jim',
//   room: 'room2'
// })

// addUser({
//   id: 44,
//   username: 'John',
//   room: 'room'
// })

// console.log('users', users)

// console.log(getUser())

// console.log('getuser:', getUser(33))

// console.log('usersInRoom', getUsersInRoom('room2'))

// // example
// const res = addUser({ id: 33, username: 'Tom', room: 'room2' })
// console.log(res)
// // example: remove user
// const removedUser = removeUser(22)
// console.log('removedUser', removedUser)
// console.log('users', users)


module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
}
