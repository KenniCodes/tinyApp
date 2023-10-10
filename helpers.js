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

module.exports = { getUserByEmail, generateRandomString };