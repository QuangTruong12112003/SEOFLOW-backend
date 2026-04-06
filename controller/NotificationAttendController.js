const { where } = require("sequelize");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const models = initModels(sequelize);

class NotificationAttendController {
  static async insertNotificarionAttend(
    notificationId,
    attendId,
    transactionOption = {}
  ) {
    try {
      const notificationAttend = await models.notificationattend.create(
        {
          notificationId: notificationId,
          attendId: attendId,
        },
        transactionOption
      );
      return notificationAttend;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getNotificationUser(userId) {
    try {
      const notification = await models.notificationattend.findAll({
        include: [
          {
            model: models.attend,
            as: "attend",
            where: { userId },
          },
          {
            model: models.notification,
            as: "notification",
          },
        ],
      });
      const result = notification.map((item) => ({
        notificationId: item.notificationId,
        projectId: item.attend?.projectId,
        title: item.notification?.title,
        createAt: item.notification?.createAt,
        status: item.status,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async updateStatusNotificationByUserNoti(attendId, notificationId) {
    try {
      const updateRow = await models.notificationattend.update(
        { status: true },
        {
          where: { attendId, notificationId },
        }
      );
      return updateRow > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async updateStatusNotificationAll(userId) {
    try {
      const notification = await models.notificationattend.findAll({
        include: [
          {
            model: models.attend,
            as: "attend",
            where: { userId },
          },
        ],
      });
      const notificationIds = notification.map((n) => n.notificationId);
      const updateStatus = await models.notificationattend.update(
        { status: true },
        { where: { notificationId: notificationIds } }
      );
      return updateStatus > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async deleteAllNotification(userId) {
    try {
      const attends = await models.attend.findAll({ where: { userId } });
      for (const item of attends) {
        await models.notificationattend.destroy({
          where: { attendId: item.attendId },
        });
      }
      return true;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async deleteAllNotificationInProject(projectId, attendId) {
    try {
      const notification = await models.notification.findAll({
        where: { projectId },
      });
      for (const item of notification) {
        await models.notificationattend.destroy({
          where: {
            notificationId: item.notificationId,
            attendId,
          },
        });
      }
      return true;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = NotificationAttendController;
