const express = require("express");
const cookieSession = require("cookie-session");
const { getUserByEmail, generateRandomString } = require('./helpers');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

const users = {};

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

const urlsForUser = (id) => {
  const userUrls = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  console.log("Users ", users, "URLS ", urlDatabase);
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const userCookie = req.session.user_cookie;
  const user = users[userCookie];
  const userUrls = urlsForUser(userCookie);
  const templateVars = { user, urls: userUrls };

  if (user) {
    res.render("urls_index", templateVars);
  } else {
    res.status(403).send("Forbidden request: Login to make this request");
  }
});

app.get("/urls/new", (req, res) => {
  const userCookie = req.session.user_cookie;
  const user = users[userCookie];
  const templateVars = { userId: userCookie, user, urls: urlDatabase };
  if (user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  const userCookie = req.session.user_cookie;
  const user = users[userCookie];
  const urlKey = urlDatabase[req.params.id];

  if (user) {
    if (urlKey) {
      if (urlKey.userID === userCookie) {
        const templateVars = { 
          shortURL: req.params.id, 
          urlKey,
          userId: userCookie,
          user,
          userUrls: urlsForUser(userCookie, urlDatabase)
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
  const urlKey = urlDatabase[shortURL];

  if (urlKey && urlKey.longURL) {
    res.redirect(`${urlKey.longURL}`)
  } else (
    res.status(404).send("Not found: URL does not exist")
  )
});

app.get("/register", (req, res) => {
  const userCookie = req.session.user_cookie;
  const user = users[userCookie];
  const templateVars = { user, userId: userCookie };
  if (user) {
    return res.redirect("/urls");
  }
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const userCookie = req.session.user_cookie;
  const user = users[userCookie];
  const templateVars = { user, userId: userCookie };
  if (user) {
    return res.redirect("/urls");
  }
  res.render("login", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL
  const userCookie = req.session.user_cookie;
  const user = users[userCookie];

  urlDatabase[shortURL] = { longURL: longURL, userID: userCookie };
  user ? res.redirect(`/urls/${shortURL}`):
  res.status(403).send("Forbidden request: Login to make this request");
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  const userCookie = req.session.user_cookie;
  if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userCookie) {
    urlDatabase[shortURL].longURL = longURL;
    res.redirect(`/urls`);
  } else {
    res.status(403).send("Forbidden request: Login to make this request");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const userCookie = req.session.user_cookie;
  const user = users[userCookie];
  const shortURL = req.params.id;
  user ? res.redirect("/urls"):
  res.status(403).send("Forbidden request: Login to make this request");
  delete urlDatabase[shortURL];
});

app.post("/register", (req, res) => {
  const randomUserId = generateRandomString(6);
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
  req.session.user_cookie = randomUserId;
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
  
  if (!userExists.password) {
    return res.status(403).send("Email/Password does not match")
  }

  const passMatch = bcrypt.compareSync(plainTxtPass, userExists.password);
  if (!passMatch) {
    return res.status(403).send("Email/Password does not match");
  }

  req.session.user_cookie = userExists.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});