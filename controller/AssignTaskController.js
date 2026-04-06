const { where, Op } = require("sequelize");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const models = initModels(sequelize);
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

class AssignTaskController {
  static async insertAssignTask(attendId, taskId, transactionOption = {}) {
    try {
      const vnTime = dayjs()
        .tz("Asia/Ho_Chi_Minh")
        .format("YYYY-MM-DD HH:mm:ss");
      console.log(`Thời gian hiện tại:  ${vnTime}`);
      const newRow = await models.taskuser.create(
        {
          attendId: attendId,
          taskId: taskId,
          assignedDate: vnTime,
        },
        { ...transactionOption }
      );
      return newRow;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async deleteAssignTask(attendId, taskId) {
    try {
      const deleteRows = await models.taskuser.destroy({
        where: { attendId: attendId, taskId: taskId },
      });
      return deleteRows > 0;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  static async getAllAssignTask() {
    try {
      const assignTasks = await models.taskuser.findAll({
        include: [
          {
            model: models.tasks,
            as: "task",
          },
          {
            model: models.attend,
            as: "attend",
            include: [
              {
                model: models.users,
                as: "user",
              },
              {
                model: models.roles,
                as: "role",
              },
            ],
          },
        ],
      });

      const formatted = assignTasks.map((item) => ({
        taskId: item.task?.taskId,
        title: item.task?.title,
        description: item.task?.description,
        status: item.task?.status,
        startDate: item.task?.startDate,
        endDate: item.task?.endDate,
        assignedDate: item.assignedDate,
        userId: item.attend?.user?.userId,
        name: item.attend?.user?.fullname,
        email: item.attend?.user?.email,
        roleId: item.attend?.roleId,
        roleName: item.attend?.role?.rolename,
      }));
      return formatted;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async getAssignTaskbUserId(userId) {
    try {
      const assignTasks = await models.taskuser.findAll({
        include: [
          {
            model: models.tasks,
            as: "task",
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
          },
          {
            model: models.attend,
            as: "attend",
            where: { userId },
            include: [
              {
                model: models.users,
                as: "user",
              },
              {
                model: models.roles,
                as: "role",
              },
            ],
          },
        ],
      });

      const formatted = assignTasks.map((item) => ({
        taskId: item.task?.taskId,
        attendId: item.attendId,
        title: item.task?.title,
        description: item.task?.description,
        status: item.task?.status,
        startDate: item.task?.startDate,
        endDate: item.task?.endDate,
        assignedDate: item.assignedDate,
        userId: item.attend?.user?.userId,
        name: item.attend?.user?.fullname,
        email: item.attend?.user?.email,
        roleId: item.attend?.roleId,
        roleName: item.attend?.role?.rolename,
        workflowId: item.task?.workflowId,
        workflowName: item.task?.workflow?.name,
        projectId: item.task?.workflow?.projectId,
        projectName: item.task?.workflow?.project?.name,
      }));
      return formatted;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async getAssignTaskbyTaskId(taskId) {
    try {
      const users = await models.taskuser.findAll({
        where: { taskId },
        include: [
          {
            model: models.attend,
            as: "attend",
            include: [
              {
                model: models.users,
                as: "user",
              },
              {
                model: models.roles,
                as: "role",
              },
            ],
          },
        ],
      });
      const result = users.map((item) => ({
        attendId: item.attendId,
        imgUrl: item.attend?.user.imgUrl,
        userId: item.attend?.user?.userId,
        fullname: item.attend?.user?.fullname,
        email: item.attend?.user?.email,
        name: item.attend?.user?.fullname,
        roleId: item.attend?.roleId,
        rolename: item.attend?.role.rolename,
        assignedDate: item.assignedDate,
      }));

      return result;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async checkExistingUserInTask(taskId, userId) {
    try {
      const task = await models.taskuser.findOne({
        where: { taskId },
        include: [
          {
            model: models.attend,
            as: "attend",
            where: { userId },
          },
        ],
      });
      return task !== null;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async checkExistingUser(userId, projectId) {
    try {
      const tasks = models.taskuser.findAll({
        where: { userId },
        include: [
          {
            model: models.tasks,
            as: "task",
            include: [
              {
                model: models.workflows,
                as: "workflow",
                where: { projectId },
              },
            ],
          },
        ],
      });
      return tasks !== null;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  static async getTaskByUserIdProjectId(projectId, attendId) {
    try {
      const tasks = await models.taskuser.findAll({
        where: { attendId },
        include: [
          {
            model: models.tasks,
            as: "task",
            include: [
              {
                model: models.workflows,
                as: "workflow",
                where: { projectId },
              },
            ],
          },
        ],
      });
      const result = tasks.map((item) => ({
        taskId: item.taskId,
        title: item.task.title,
        startDate: item.task.startDate,
        endDate: item.task.endDate,
        assignDate: item.assignedDate,
        timeSuccess: item.timeSuccess,
        status: item.task.status,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async searchTaskByUserId(userId, keyword) {
    try {
      const assignTasks = await models.taskuser.findAll({
        include: [
          {
            model: models.tasks,
            as: "task",
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
          },
          {
            model: models.attend,
            as: "attend",
            where: { userId },
            include: [
              {
                model: models.users,
                as: "user",
              },
              {
                model: models.roles,
                as: "role",
              },
            ],
          },
        ],
        where: {
          [Op.or]: [
            { "$task.title$": { [Op.like]: `%${keyword}%` } },
            { "$task.description$": { [Op.like]: `%${keyword}%` } },
            { "$task.workflow.name$": { [Op.like]: `%${keyword}%` } },
            { "$task.workflow.project.name$": { [Op.like]: `%${keyword}%` } },
          ],
        },
      });

      const formatted = assignTasks.map((item) => ({
        taskId: item.task?.taskId,
        attendId: item.attendId,
        title: item.task?.title,
        description: item.task?.description,
        status: item.task?.status,
        startDate: item.task?.startDate,
        endDate: item.task?.endDate,
        assignedDate: item.assignedDate,
        userId: item.attend?.user?.userId,
        name: item.attend?.user?.fullname,
        email: item.attend?.user?.email,
        roleId: item.attend?.roleId,
        roleName: item.attend?.role?.rolename,
        workflowId: item.task?.workflowId,
        workflowName: item.task?.workflow?.name,
        projectId: item.task?.workflow?.projectId,
        projectName: item.task?.workflow?.project?.name,
      }));
      return formatted;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async updateTaskByStatusSuccess(taskId) {
    try {
      const vnTime = dayjs()
        .tz("Asia/Ho_Chi_Minh")
        .format("YYYY-MM-DD HH:mm:ss");
      const [updateRow] = await models.taskuser.update(
        { timeSuccess: vnTime },
        { where: { taskId } }
      );
      return updateRow > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async updateTaskByStatusNotSuccess(taskId) {
    try {
      const [updateRow] = await models.taskuser.update(
        { timeSuccess: null  },
        { where: { taskId } }
      );
      return updateRow > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async getAssignTaskTimeSuccesssbUserId(userId) {
    try {
      const assignTasks = await models.taskuser.findAll({
        include: [
          {
            model: models.tasks,
            as: "task",
            where: { status: "Hoàn thành" },
          },
          {
            model: models.attend,
            as: "attend",
            where: { userId },
          },
        ],
        order: [["assignedDate", "DESC"]],
        limit: 5,
      });

      const formatted = assignTasks.map((item) => ({
        taskId: item.taskId,
        title: item.task.title,
        startDate: item.task.startDate,
        endDate: item.task.endDate,
        assignedDate: item.assignedDate,
        timeSuccess: item.timeSuccess,
      }));
      return formatted;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}

module.exports = AssignTaskController;
