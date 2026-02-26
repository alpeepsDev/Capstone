// AI Controllers
const assistantController = require("./assistantController");
const insightController = require("./insightController");
const aiPreferenceController = require("./aiPreferenceController");

module.exports = {
  ...assistantController,
  ...insightController,
  ...aiPreferenceController,
};
