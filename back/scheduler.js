const cron = require("node-cron");
const {
  processAddQueue,
  processAddSelectedQueue,
  processUpdateSelectedOrderQueue,
} = require("./utils");

const startSchedulers = () => {
  cron.schedule("*/10 * * * * *", () => {
    processAddQueue();
  });

  cron.schedule("* * * * * *", () => {
    processAddSelectedQueue();
    processUpdateSelectedOrderQueue();
  });

  console.log("Cron schedulers started");
};

module.exports = { startSchedulers };
