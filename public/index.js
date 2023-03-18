const socket = io();

const chatMessages = document.getElementById("chat-messages");
const sendMessage = document.getElementById("chat-form");
let response = {};

let localResponse = {};

socket.on("welcome-message", (message) => {
  displayAdminMessage(message.formatMessage);
  response = message;
  localStorage.setItem("response", JSON.stringify(message));
});

socket.on("admin-message", (message) => {
  chatMessages.scrollTop = chatMessages.scrollHeight;
  displayAdminMessage(message);
});

socket.on("history", (message) => {
  chatMessages.scrollTop = chatMessages.scrollHeight;
  displayAdminMessage(message);
});

// socket.on("userMessage", (message) => {
//   chatMessages.scrollTop = chatMessages.scrollHeight;
//   displayUserMessage(message);
// });

socket.on("menu", (message) => {
  chatMessages.scrollTop = chatMessages.scrollHeight;
  displayAdminMessage(message);
});

socket.on("saveToStorage", (message) => {
  chatMessages.scrollTop = chatMessages.scrollHeight;
  localStorage.setItem("response", JSON.stringify(message));
});

sendMessage.addEventListener("submit", (e) => {
  e.preventDefault(); // prevent submitting to a file
  let msg = e.target.elements.msg.value; // the value of the element with id = msg
  msg = msg.trim();
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
  localResponse = JSON.parse(localStorage.getItem("response"));
  localResponse["input"] = msg;
  socket.emit("chatMessage", localResponse);
  console.log(msg);
});

function displayAdminMessage(message) {
  const div = document.createElement("div");
  let list = message.text;
  if (msg.input === "98") {
    list = `<p class="meta">Your Order history...</span></p>`;
  }
  if (typeof message["text"] === "object") {
    list = "";
    for (let i = 0; i < message["text"].length; i++) {
      list += `<li>${message["text"][i]}</li>`;
    }
  }
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
  <ul class="items">
    ${list}
    </ul>`;
  document.querySelector("#chat-messages").appendChild(div);
}

function displayHistory(message) {
  const div = document.createElement("div");
  let list = "";
  for (let i = 0; i < message.length; i++) {
    list += `<li>${message[i]}</li>`;
  }
  div.classList.add("message");
  div.innerHTML = `<p class="meta">Your Order history...</span></p>
  <ul id="items">
    ${list}
    </ul>`;
  document.querySelector("#chat-messages").appendChild(div);
}
