const socket = io()
// grab elements needed to handle UI disabling while requests process:
const $messages = document.querySelector('#messages')
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
// grab send location button
const $sendLocationButton = document.querySelector('#send-location')
// Message Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
// grab location template
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
// grab sidebar template
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
// grab query string & destructures input
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })
// ignoreQueryPrefix removes prefixed "?" from query string



// handle autoscroll to scroll window to latest message:
const autoscroll = () => {
  // Grab new message element
  const $newMessage = $messages.lastElementChild

  // height of the new message:
  const newMessageStyles = getComputedStyle($newMessage)
  newMessageMargin = parseInt(newMessageStyles.marginBottom)
  // returns total height including margin:
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // visible height:
  const visibleHeight = $messages.offsetHeight

  // height of messages container:
  const containerHeight = $messages.scrollHeight

  // Distance user manually scrolled:
  const scrollOffset = $messages.scrollTop + visibleHeight

  // adding by visibleHeight allows us to compensate for
  if (containerHeight - newMessageHeight <= scrollOffset) {
    // if user is at the bottom of the window, then scroll to latest message:
    $messages.scrollTop = $messages.scrollHeight // fires autoscroll, and scrolls window to bottom.
  }

  console.log(newMessageMargin, newMessageHeight)
}

socket.on('message', (message) => { // when message event fires

  // compile template with data included:
  const html = Mustache.render(messageTemplate, {
    // send message to template:
    username: message.username,
    message: message.text, // pick message.text off the new object
    createdAt: moment(message.createdAt).format('h:mm a') // format & show createdAt timestamp,
  })

  // appends the above message to the end of the $messages list.
  $messages.insertAdjacentHTML('beforeend', html) // runs before the end of execution.
  autoscroll() // runs autoscroll
})



// handle output of 'location message'
socket.on('locationMessage', (message) => {
  // console.log(message)

  // render locationMessageTemplate
  const html = Mustache.render(locationMessageTemplate, {
    // adds username to data that gets sent to template:
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('h:mm a')
  })

  // appends the above message to the end of the $messages list.
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll() // runs autoscroll
})



// fires when roomData changes, - either user enters or user leaves:
socket.on('roomData', ({ room, users }) => {
  // destructures roomData grabbing variables room & users
  console.log('roomData', room, users)

  // setup template using data
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  // append to innerHTML
  document.querySelector('#sidebar').innerHTML = html
})



//setup event listener for form submission
$messageForm.addEventListener('submit', (e) => {
  e.preventDefault()

  // disable form
  $messageFormButton.setAttribute('disabled', 'disabled') // disables the button

  // save value of input to message
  const message = e.target.elements.message.value

  // fire off 'sendMessage' event, and send message:
  socket.emit('sendMessage', message, (error) => {

    // enable form
    $messageFormButton.removeAttribute('disabled') // enables location button
    $messageFormInput.value = '' // clears the value of the input
    $messageFormInput.focus() // sets focus to input after it's been cleared

    if (error) return console.log(error)

    // if no error:
    console.log('The message was sent:', message)
  })
})


// setup event listener for location button
$sendLocationButton.addEventListener('click', (e) => {
  e.preventDefault()

  // access browser's native geolocation api via: navigator.geolocation
  if (!navigator.geolocation) throw new Error('GeoLocation is not supported here.')

  // disable button -- while request is processing:
  $sendLocationButton.setAttribute('disabled', 'disabled')

  // get geo-location
  navigator.geolocation.getCurrentPosition((position) => {
    // using callback instead of promise or async
    socket.emit('sendLocation', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, () => { // handles acknowledgement message

      // handle enable:
      $sendLocationButton.removeAttribute('disabled') // enables location button

      // clear input field and set focus
      $messageFormInput.value = ''
      $messageFormInput.focus()

      console.log('Location Shared!')
    })
  })
})


// fires action when a user joins a room:
socket.emit('join', { username, room }, (error) => {
  // process any errors: joining room or creating user
  if (error) {
    alert(error)
    // redirect user back to join page:
    location.href = '/'
  }

})
