// Admin Controllers
const adminController = require("./admin.controller");
const userController = require("./user.controller");

module.exports = {
  ...adminController,
  ...userController,
};
