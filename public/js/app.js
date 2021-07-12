let socket = io()
// let joinUserForm = document.getElementById("joinUser")
// let userNameElement = document.getElementById("username")
// joinUserForm.addEventListener("submit", (e) => {
//     e.preventDefault()
//     // socket.emit("joinUser", { userID: xyz })
//     // var formData = new FormData(joinUserForm);
//     // const username = formData.get('username');
//     //socket.on('connect', function() {
//     //    const sessionID = socketConnection.socket.sessionid
//     //    console.log(sessionID)
//     socket.emit("joinUser", { userID: userNameElement.value })
//     //})
// })

// socket.on('connect', function() {
//        const sessionID = socket.sessionid
//        console.log(sessionID)
// })
const userName = localStorage.getItem('username')
console.log(userName)
// console.log(socket.id)
// socket.emit("socketID", { userID: userName, socketID: socket.id})
// var socketConnection = io.connect();
socket.on("connect", () => {
  console.log(socket.id); // x8WIv7-mJelg7on_ALbx
  socket.emit("socketID", { userID: userName, socketID: socket.id })
});

socket.on('newUser', (message) => {
  console.log("here", message)
})

socket.on("message", (message) => {
  console.log("a message was sent")
  console.log(message)
  let messagesElement = document.getElementById("messages")
  messagesElement.innerHTML += `<li>${message}</li>` 
})

const fetchMessages = (objName) => {
  // this is the case if a normal user is selected and not for the room
  localStorage.setItem("toUsername", objName.value)
  // const url = "/messages"
  const data = { fromUsername: userName, toUsername: objName.value }
  console.log(data)
  const url = "/messages"
  fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify(data)
  }).then(async (response) => {

    const messages = await response.json()
    // now we need to insert the messages as list element to the frontend
    // get the id of the list of messages
    // adding li elements to the class
    console.log("Messages between to and from user")
    console.log(messages)
    let messagesElement = document.getElementById("messages")
    messagesElement.innerHTML = ""
    // messages.forEach(message => {
    //   let liElement = document.createElement("li")
    //   liElement.innerHTML = message.content
    //   messagesElement.appendChild(liElement)
    // });
    console.log(messagesElement)
    for(message of messages)
    {
      messagesElement.innerHTML+=`<li>${message.content}</li>`
    }
    console.log(messagesElement)
  }
  ).then(
    html => console.log(html)
  );
}


let messageForm = document.getElementById("message-form")
messageForm.addEventListener("submit", (e) => {
  e.preventDefault()
  let message = document.getElementById("message-box")
  console.log(message.value)
  // socket.on("connect", () => {
  socket.emit("message", { fromUsername: userName, toUsername: localStorage.getItem("toUsername"), content: message.value })
  // });
})