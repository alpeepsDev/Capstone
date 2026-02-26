// Labels Controllers
const labelController = require("./label.controller");
const savedFilterController = require("./savedFilter.controller");

module.exports = {
  ...labelController,
  ...savedFilterController,
};
