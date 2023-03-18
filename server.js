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
let cart = [];

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
    action: "welcome",
    cart,
    formatMessage: formatMessage("admin", welcomeList),
  });

  socket.on("chatMessage", (msg) => {
    let userMealName = "";
    let userInput = null;
    let userMeal = {};
    if (session === msg.session) {
      socket.emit("admin-message", formatMessage("You", msg.input));
      if (msg["action"] === "welcome") {
        console.log(session);
        if (msg.input === "98") {
          if (msg.history.length === 0) {
            socket.emit(
              "admin-message",
              formatMessage("admin", ["Oops", "Your history is empty!!!"])
            );
          } else {
            // socket.emit("admin-message", ["Order history!!!", "Cheers!"]);
            socket.emit("history", formatMessage("admin", msg.history));
            return;
          }
        } else if (msg.input === "99") {
          if (msg["cart"].length < 1) {
            socket.emit(
              "admin-message",
              formatMessage("admin", ["Oops", "Your cart is empty!!!"])
            );
            return;
          }
          msg["history"].push(msg.cart);
          socket.emit(
            "admin-message",
            formatMessage("admin", ["Order placed!!!", "Cheers!"])
          );
        } else if (msg.input === "97") {
          console.log("Here");
          if (msg["cart"].length < 1) {
            socket.emit(
              "admin-message",
              formatMessage("admin", ["Oops", "Your cart is empty!!!"])
            );
            console.log("Are you here");
            return;
          }
          socket.emit(
            "admin-message",
            formatMessage("admin", ["Current order:", msg.cart[-1]])
          );
          socket.emit(
            "admin-message",
            formatMessage("admin", ["Current order:", msg.cart[-1]])
          );
        } else if (msg.input === "0") {
          if (msg["cart"].length < 1) {
            socket.emit(
              "admin-message",
              formatMessage("admin", ["Oops", "Your cart is empty!!!"])
            );
            return;
          }
          socket.emit(
            "admin-message",
            formatMessage("admin", ["Order cancelled!!!", "Cheers!"])
          );
          msg.cart = [];
        } else if (msg.input === "1") {
          msg.action = "subMenu";
          socket.emit("menu", formatMessage("admin", MENU));
        }
      } else if (msg.action === "subMenu" && !msg.checkOut) {
        userMealName = msg.MENU[parseInt(msg.input) - 1];
        console.log(userMealName);
        userMeal = foodList[userMealName];
        // { special: [ true, 'fries', 100 ], amount: 500 }
        if (userMeal) {
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
          msg.action = "checkOut"
          socket.emit("admin-message", formatMessage("admin", toSelect));
        } else {
          msg.action = "welcome";
          socket.emit("admin-message", formatMessage("admin", "Invalid input"));
        }
      } else if (msg.checkOut && msg.action === "checkOut") {
        let cartItem = [msg.userMealName];
        let checkOutMessage = `Cheers! ${msg.userMealName} has been put in your shopping cart...`;
        if (msg.input === "1") {
          cartItem.push(msg["checkOut"].amount);
        } else if (msg.input === "2") {
          cartItem.push(msg["checkOut"].amount + msg["checkOut"]["special"][2]);
        }
        if (!cartItem[1]) {
          socket.emit(
            "admin-message",
            formatMessage(
              "admin",
              `Invalid input... Select right option to continue`
            )
          );
          return;
        } else {
          msg["cart"] = cartItem;
          msg["action"] = "welcome";
          socket.emit("admin-message", formatMessage("admin", checkOutMessage));
        }
      }
      /*userInput = msg.input;
      if (userInput !== "1" && userInput !== "98" && userInput !== "99" && userInput !== "97" && userInput !== "0" && (msg.action === "welcome" || msg.action === "subMenu")) {
        socket.emit(
          "admin-message",
          formatMessage("admin", "Invalid input entered")
        );
      }*/
    }
    // msg.formatTime = formatTime();
    socket.emit("saveToStorage", msg);
  });
});

server.listen(PORT, () => {
  console.log(`Server is up on port ${PORT}`);
});
