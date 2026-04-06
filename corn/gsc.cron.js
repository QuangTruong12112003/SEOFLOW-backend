const cron = require("node-cron");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const { syncGSCBySite } = require("../controller/gscSyncService");
const models = initModels(sequelize);

const runDailySync = async () => {
  const today = new Date();
  today.setDate(today.getDate() - 3);
  const date = today.toISOString().slice(0, 10);

  const sites = await models.siteurl.findAll({
    include: [
      {
        model: models.projects,
        as: "project",
        include: [{ model: models.users, as: "createBy_user" }],
      },
    ],
  });

  for (const site of sites) {
    try {
      await syncGSCBySite(site, date);
    } catch (err) {
      console.error(`[ERROR] Đồng bộ ${site.url} thất bại:`, err.message);
    }
  }
};

cron.schedule("32 15 * * *", () => {
  console.log("Cron GSC đang chạy...");
  runDailySync();
});
