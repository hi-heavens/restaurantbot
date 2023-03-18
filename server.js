const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const dotenv = require("dotenv");
const express = require("express");
const session = require("cookie-session");
dotenv.config({ path: "./config.env" });
const foodList = require("./food.json");
const formatMessage = require("./utils/formatMessage.js");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const publicDirectoryPath = path.join(__dirname, "./public");

app.use(express.static(publicDirectoryPath));

const PORT = process.env.PORT || 3000;

let sum = null;
const welcomeList = [
  "Select 1 to Place an order",
  "Select 99 to checkout order",
  "Select 98 to see order history",
  "Select 97 to see current order",
  "Select 0 to cancel order",
];

const MENU = [
  "Bacon cheeseburger",
  "Chicken alfredo pasta",
  "Caesar salad",
  "Margherita pizza",
  "Fish and chips",
  "Grilled salmon",
  "New York-style cheesecake",
  "Chocolate lava cake",
  "Chicken wings",
];

let history = [];

const sessionMiddleWare = session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
});

app.use(sessionMiddleWare);
io.use((socket, next) => {
  return sessionMiddleWare(socket.request, socket.request.res, next);
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  let session = socket.id;
  let input = "";
  socket.emit("welcome-message", {
    welcomeList,
    session,
    input,
    MENU,
    history,
    formatMessage: formatMessage("admin", welcomeList),
  });

  socket.on("chatMessage", (msg) => {
    let userMealName = "";
    let cart = [];

    let userMeal = {};
    if (session === msg.session) {
      socket.emit("userMessage", formatMessage("You", msg.input));
      if (msg.input === "1" && !msg.action) {
        msg["action"] = "subMenu";
        socket.emit("menu", formatMessage("admin", MENU));
        console.log("Select menu item");
      } else if (msg.action === "subMenu" && !msg.checkOut) {
        userMealName = msg.MENU[parseInt(msg.input) - 1];
        userMeal = foodList[userMealName];
        // { special: [ true, 'fries', 100 ], amount: 500 }
        let isSpecial = userMeal["special"];
        let toSelect = [userMealName];
        if (isSpecial[0]) {
          toSelect.push(
            `Select 1 to checkout without ${isSpecial[1]} - price = #${userMeal.amount}`
          );
          toSelect.push(
            `Select 2 to checkout with ${isSpecial[1]} - +fee. #${
              isSpecial[2] + userMeal.amount
            }`
          );
        } else {
          toSelect.push(
            `Select 1 to checkout, total price - #${userMeal.amount}`
          );
        }
        msg["checkOut"] = userMeal;
        msg["userMealName"] = userMealName;
        socket.emit("admin-message", formatMessage("admin", toSelect));
        console.log("Sub menu item selected");
      } else if (msg.checkOut && msg.action === "subMenu") {
        let cart = [];
        let cartItem = [msg.userMealName];
        let checkOutMessage = [
          `Cheers! ${msg.userMealName} has been put in your shopping cart...`,
        ];
        if (msg.input === "1") {
          cartItem.push(msg["checkOut"].amount);
        } else if (msg.input === "2") {
          cartItem.push(msg["checkOut"].amount + msg["checkOut"]["special"][2]);
        } else {
          socket.emit(
            "admin-message",
            formatMessage("admin", [
              "Invalid input",
              "Select 1 or 2 to continue",
            ])
          );
          return;
        }
        msg["cart"] = cartItem;
        msg["action"] = "welcomeList";
        socket.emit("admin-message", formatMessage("admin", checkOutMessage));
      } else if (msg["cart"].length > 1 || msg["history"]) {
        console.log("Hereeeeeeeeeeeeee");
        if (msg.input === "99") {
          msg["history"].push(msg.cart);
          // msg["cart"] = null;
          socket.emit("admin-message", formatMessage("admin", ["Order placed!!!", "Cheers!"]));
        } else if (msg.input === "98") {
          if (msg.history.length === 0) {
            socket.emit("admin-message", formatMessage("admin", ["Oops", "Your history is empty!!!"]));
          } else {
            // socket.emit("admin-message", ["Order history!!!", "Cheers!"]);
            socket.emit("admin-message", formatMessage("admin", msg.history));
          }
        } else if (msg.input === "97") {
          socket.emit("admin-message", formatMessage("admin", ["Current order:", msg.cart[-1]]));
        } else if (msg.input === "0") {
          socket.emit("admin-message", formatMessage("admin", ["Order cancelled!!!", "Cheers!"]));
          msg.cart = null;
        } else {
          socket.emit("admin-message", formatMessage("admin", [
            "Invalid input",
            "Select 1 or 2 to continue",
          ]));
          return;
        }
      } else if (!msg.cart && msg.input === "99") {
        socket.emit("admin-message", formatMessage("admin", ["Oops", "Your cart is empty!!!"]));
      }
    }
    // msg.formatTime = formatTime();
    socket.emit("saveToStorage", msg);
  });
});

server.listen(PORT, () => {
  console.log(`Server is up on port ${PORT}`);
});
