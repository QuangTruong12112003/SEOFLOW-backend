const cron = require("node-cron");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const TaskStatusTriggerServices = require("../trigger/TaskStatusTriggerServices");
const NotificationContronller = require("../controller/NotificationController");
const AssignTaskController = require("../controller/AssignTaskController");
const NotificationAttendController = require("../controller/NotificationAttendController");
const { sendMailNotification } = require("../middleware/sendOtp");
const models = initModels(sequelize);

const runDailySync = async () => {
  const today = new Date().toISOString().split("T")[0];
  const tasks = await models.tasks.findAll({
    include: [
      {
        model: models.workflows,
        as: "workflow",
        include: [
          {
            model: models.projects,
            as: "project",
          },
        ],
      },
    ],
  });
  for (const item of tasks) {
    const startDate = item.startDate;
    const endDate = item.endDate;
    const formattedStartDate = new Date(startDate).toISOString().split("T")[0];
    const formattedEndDate = new Date(endDate).toISOString().split("T")[0];
    if ((today === formattedStartDate || today > formattedStartDate) && item.status === "Chưa bắt đầu") {
      await models.tasks.update(
        { status: "Đang thực hiện" },
        { where: { taskId: item.taskId } }
      );
      await TaskStatusTriggerServices.onTaskChanged(item.taskId);
    }
    if (today === formattedEndDate && item.status !== "Hoàn thành") {
      const transaction = await sequelize.transaction();
      try {
        const notifiaction = await NotificationContronller.insertNotification(
          "Công việc đã tới hạn dự kiến",
          item.workflow?.projectId,
          null,
          { transaction }
        );
        const assignTask = await AssignTaskController.getAssignTaskbyTaskId(
          item.taskId
        );
        for (const itemAssign of assignTask) {
          await NotificationAttendController.insertNotificarionAttend(
            notifiaction.notificationId,
            itemAssign.attendId,
            { transaction }
          );
          const projectName =
            item.workflow?.project?.name || "Dự án không xác định";
          const projectLink = `$${process.env.CLIENT_URL}?projectId=${item.workflow?.projectId}&taskId=${item.taskId}`;
          await sendMailNotification(
            itemAssign.email,
            `Công việc ${item.title} của bạn đang đảm nhận đã tới hạn hoàn thành dự kiến`,
            projectName,
            projectLink
          );
        }
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        console.log(error);
      }
    }
  }
};

cron.schedule("30 23 * * *", () => {
  console.log("Cron kiểm tra trạng thái đang chạy đang chạy...");
  runDailySync();
});
