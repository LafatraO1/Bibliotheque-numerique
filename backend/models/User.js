const fs = require("fs");
const path = require("path");

const userFile = path.join(__dirname, "../users.json");

function readUsers() {
  if (!fs.existsSync(userFile)) return [];
  return JSON.parse(fs.readFileSync(userFile));
}

function writeUsers(users) {
  fs.writeFileSync(userFile, JSON.stringify(users, null, 2));
}

module.exports = { readUsers, writeUsers };
