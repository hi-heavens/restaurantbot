const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const dotenv = require("dotenv");
const express = require("express");
const session = require("cookie-session");
dotenv.config({ path: "./config.env" });
const foodList = require("./food.json");

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
  socket.emit("welcome-message", { welcomeList, session, input, MENU });

  socket.on("chatMessage", (msg) => {
    let userMealName = "";
    let cart = [];
    if (session === msg.session) {
      socket.emit("userMessage", msg);
      if (msg.input === "1" && !msg.action) {
        msg["action"] = "subMenu";
        socket.emit("menu", msg);
        console.log("Select menu item");
      } else if (msg.action === "subMenu" && !msg.checkOut) {
        userMealName = msg.MENU[parseInt(msg.input) - 1];
        let userMeal = foodList[userMealName];
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
        msg["checkOut"] = "check";
        msg["userMealName"] = userMealName;
        socket.emit("admin-message", toSelect);
        console.log("Sub menu item selected");
      } else if (msg.checkOut && msg.action) {
        let checkOutMessage = [
          `Cheers! ${msg.userMealName} has been put in your shopping cart...`,
        ];
        if (msg.input === "1") {
          cart.push();
        } else if (msg.input === "2") {
        } else {
        }
        socket.emit("admin-message", checkOutMessage);
        console.log("Payment option selected");
      }
      /*(
            (foodChoice[1] = `Select 1 without ${special} - price = ${customerFood.amount}`)
          )),
            (foodChoice[2] = `Select 2 with ${special} - add. #${customerFood.special[2]}`);
        } else {
          foodChoice[1] = `total price - #${customerFood.amount}`;
        }
        if (isSpecial) {
          sum = userMeal.amount + userMeal.special[2];
        } else {
          sum = userMeal.amount;
        }
        const paymentOption = [
          `Total amount to pay is ${sum}`,
          "Select 1 to Pay",
          "Select 0 to cancel order",
        ];*/
    }
    socket.emit("saveToStorage", msg);
  });
});

server.listen(PORT, () => {
  console.log(`Server is up on port ${PORT}`);
});
