const { default: handleID } = require("../../fontend/src/middleware/handleID");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const dayjs = require("dayjs");
require("dayjs/plugin/utc");
require("dayjs/plugin/timezone");
dayjs.extend(require("dayjs/plugin/utc"));
dayjs.extend(require("dayjs/plugin/timezone"));
const models = initModels(sequelize);

class NotificationContronller {
  static async insertNotification(
    title,
    projectId,
    attendId,
    transactionOption = {}
  ) {
    try {
      const createAt = dayjs().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");
      console.log(createAt);

      const notification = await models.notification.create(
        {
          notificationId: handleID("NTF"),
          title: title,
          createAt: createAt,
          projectId: projectId,
          createBy: attendId,
        },
        transactionOption
      );
      return notification;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = NotificationContronller;
