const socket = io();

let userInput = "";
const chatMessages = document.getElementById("chat-messages");
const sendMessage = document.getElementById("chat-form");
let response = {};

let localResponse = {};

socket.on("welcome-message", (message) => {
  displayMessage(message.welcomeList);
  response = message;
  localStorage.setItem("response", JSON.stringify(message));
});

socket.on("admin-message", (message) => {
  displayMessage(message);
//   response = message;
});

socket.on("history", (message) => {
  displayMessage(message);
//   response = message;
});

socket.on("userMessage", (message) => {
  displayUserMessage(message.input);
});

socket.on("menu", (message) => {
  displayMessage(message.MENU);
});

socket.on("confirmPay", (message) => {
    // displayMessage(message.MENU);
    // localStorage.setItem("response", JSON.stringify(message));
    console.log(message);
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

function displayMessage(message) {
  const div = document.createElement("div");
  let list = "";
  for (let i = 0; i < message.length; i++) {
    list += `<li>${message[i]}</li>`;
  }
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${"bot"} <span>${"time"}</span></p>
  <ul id="items">
    ${list}
    </ul>`;
  document.querySelector("#chat-messages").appendChild(div);
}

function displayUserMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${"bot"} <span>${"time"}</span></p>
  <p id="item">
    ${message}
    </p>`;
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