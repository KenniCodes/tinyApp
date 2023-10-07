//          GLOBAL VARIABLES 
const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};
const users = {};
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

const urlsForUser = (id) => {
  const userUrls = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

// 
//          GET REQUESTS
// 
app.get("/", (req, res) => {
  console.log("Users ", users, "URLS ", urlDatabase);
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const userUrls = urlsForUser(userId);
  const templateVars = { user, urls: userUrls };

  if (user) {
    res.render("urls_index", templateVars);
  } else {
    res.status(403).send("Forbidden request: Login to make this request");
  }
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { userId, user, urls: urlDatabase };
  if (user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const urlKey = urlDatabase[req.params.id];

  if (user) {
    if (urlKey) {
      if (urlKey.userID === userId) {
        const templateVars = { 
          shortURL: req.params.id, 
          urlKey,
          userId,
          user,
          userUrls: urlsForUser(userId, urlDatabase)
        };
        res.render("urls_show", templateVars);
      } else {
        res.status(403).send("Forbidden request: You do not own this URL.");
      }
    } else {
      res.status(404).send("Not found: URL does not exist.");
    }
  } else {
    res.status(403).send("Forbidden: Please log in to access this page.");
  }
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const urlID = urlDatabase[shortURL];

  if (urlID && urlID.longURL) {
    res.redirect(urlID.longURL)
  } else (
    res.status(404).send("Not found: URL does not exist")
  )
});

app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { user, userId };
  if (user) {
    return res.redirect("/urls");
  }
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { user, userId };
  if (user) {
    return res.redirect("/urls");
  }
  res.render("login", templateVars);
});
// 
//          POST REQUESTS
// 
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL
  const userId = req.cookies["user_id"];
  const user = users[userId];

  urlDatabase[shortURL] = { longURL: longURL, userID: userId };
  user ? res.redirect(`/urls/${shortURL}`):
  res.status(403).send("Forbidden request: Login to make this request");
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  const userId = req.cookies["user_id"];
  if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userId) {
    urlDatabase[shortURL].longURL = longURL;
    res.redirect(`/urls`);
  } else {
    res.status(403).send("Forbidden request: Login to make this request");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const shortURL = req.params.id;
  user ? res.redirect("/urls"):
  res.status(403).send("Forbidden request: Login to make this request");
  delete urlDatabase[shortURL];
});

app.post("/register", (req, res) => {
  const randomUserId = generateRandomString();
  const newUserEmail = req.body.email;
  const newUserPassword = req.body.password;
  if (newUserEmail === '' || newUserPassword === '') {
    return res.status(406).send("Email/Password cannot be empty.");
  }
  const emailExists = getUserByEmail(newUserEmail, users);
  if (emailExists) {
    return res.status(400).send("Error: Email is already registered.")
  }
  const encryptedPass = bcrypt.hashSync(newUserPassword, 10);
  users[randomUserId] = { 
    id: randomUserId, 
    email: newUserEmail, 
    password: encryptedPass
  };
  res.cookie("user_id", randomUserId);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const plainTxtPass = req.body.password;
  
  if (userEmail === '' || plainTxtPass === '') {
    return res.status(406).send("Email/Password cannot be empty.");
  }
  
  const userExists = getUserByEmail(userEmail, users);
  if (!userExists) {
    return res.status(403).send("Email cannot be found");
  }
  
  const passMatch = bcrypt.compareSync(plainTxtPass, userExists.password);
  if (!passMatch) {
    return res.status(403).send("Password does not match");
  }

  res.cookie("user_id", userExists.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});