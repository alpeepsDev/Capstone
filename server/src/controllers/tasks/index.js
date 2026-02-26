// Tasks Controllers
const taskController = require("./task.controller");
const taskRelationController = require("./taskRelation.controller");
const taskTemplateController = require("./taskTemplate.controller");

module.exports = {
  ...taskController,
  ...taskRelationController,
  ...taskTemplateController,
};
