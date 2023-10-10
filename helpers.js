const { users, urlDatabase } = require('./database/database');

const getUserByEmail = function(email, users) {
  for (let ID in users) {
    if (users[ID].email === email) {
      return users[ID];
    }
  }
  return undefined;
};

const generateRandomString = function(length = 6) {
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => alphanumeric[Math.floor(Math.random() * alphanumeric.length)]).join('');
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

module.exports = { getUserByEmail, generateRandomString, urlsForUser };