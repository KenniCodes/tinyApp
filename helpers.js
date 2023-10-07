const getUserByEmail = function(email, users) {
  let ID;
  for (ID in users) {
    if (users[ID].email === email) {
      return users[ID];
    }
  }
  return ID;
};

const generateRandomString = function(length = 6) {
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => alphanumeric[Math.floor(Math.random() * alphanumeric.length)]).join('');
};

module.exports = { getUserByEmail, generateRandomString };