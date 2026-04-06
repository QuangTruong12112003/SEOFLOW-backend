const cron = require("node-cron");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const NotificationContronller = require("../controller/NotificationController");
const NotificationAttendController = require("../controller/NotificationAttendController");
const { where } = require("sequelize");
const { sendMailNotification } = require("../middleware/sendOtp");
const models = initModels(sequelize);

const runDailySync = async () => {
  const today = new Date();

  const users = await models.users.findAll({
    where: {
      status: 0,
    },
  });

  for (const item of users) {
    const transaction = await sequelize.transaction();
    try {
      const createdAt = new Date(item.craeteAt);
      const diffTime = today - createdAt;
      console.log(diffTime);
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      console.log(diffDays);

      if (diffDays > 10) {
        const attends = await models.attend.findAll({
          where: { userId: item.userId },
          include: [
            {
              model: models.users,
              as: "user",
            },
          ],
        });

        for (const itemAttend of attends) {
          await models.taskuser.destroy({
            where: { attendId: itemAttend.attendId },
            transaction,
          });

          const notification = await NotificationContronller.insertNotification(
            `Thông báo xóa người dùng có tài khoản email ${itemAttend.user.email} do quá 10 ngày chưa xác thực tài khoản `,
            itemAttend.projectId,
            null,
            {transaction}
          );

          const project = await models.projects.findOne({
            where: { projectId: itemAttend.projectId },
          });

          const attend = await models.attend.findOne({
            where: { userId: project.createBy, projectId: project.projectId },
            include: [
              {
                model: models.users,
                as: "user",
              },
            ],
          });


          await NotificationAttendController.insertNotificarionAttend(
            notification.notificationId,
            attend.attendId,
            {transaction}
          );

          await sendMailNotification(
            attend.user?.email,
            `Thông báo xóa người dùng có tài khoản email ${itemAttend.user.email} của dự án ${project.name}  do quá 10 ngày chưa xác thực tài khoản `,
            project.name,
            `${process.env.CLIENT_URL}?project=${project.projectId}`
          );
        }

        await models.attend.destroy({
          where: { userId: item.userId },
          transaction,
        });

        await models.users.destroy({
          where: { userId: item.userId },
          transaction,
        });

        await transaction.commit();
      }
    } catch (error) {
      console.error(`Error deleting user ${item.userId}:`, error);
      await transaction.rollback();
    }
  }
};

cron.schedule("13 22 * * *", () => {
  console.log("Cron xóa người dùng chưa xác thực đang chạy...");
  runDailySync();
});
