//          GLOBAL VARIABLES 
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};
// 
//          LISTEN
// 
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
// 
//          SET
// 
app.set("view engine", "ejs");
// 
//          MIDDLEWARE
// 
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
// 
//          GLOBAL FUNCTIONS
// 
const generateRandomString = () => {
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * alphanumeric.length);
    result += alphanumeric[randomIndex];
  }
  return result;
};

const getUserByEmail = (email, users) => {
  for (let userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
};
// 
//          GET REQUESTS
// 
app.get("/", (req, res) => {
  console.log(users); //      FOR DEBUGGING DELETE AT THE END
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { user, urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { userId, user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id],
    userId,
    user
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { user, userId };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { user, userId };
  res.render("login", templateVars);
});
// 
//          POST REQUESTS
// 
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls`);
});

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const randomUserId = generateRandomString();
  const newUserEmail = req.body.email;
  const newUserPassword = req.body.password;
  const emailExists = getUserByEmail(newUserEmail, users);
  if (emailExists) {
    return res.status(400).send("Error: Email is already registered.")
  }
  users[randomUserId] = { 
    id: randomUserId, 
    email: newUserEmail, 
    password: newUserPassword
  };
  res.cookie("user_id", randomUserId);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPass = req.body.password;
  const userExists = getUserByEmail(userEmail, users);
  if (!userExists) {
    return res.status(403).send("Email cannot be found");
  }

  if (userExists.password !== userPass) {
    return res.status(403).send("Password does not match");
  }

  res.cookie("user_id", userExists.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});