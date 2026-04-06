const { where, Op } = require("sequelize");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const TaskStatusTriggerServices = require("../trigger/TaskStatusTriggerServices");
const models = initModels(sequelize);

class TaskController {
  static async insert(taskData) {
    try {
      if (taskData.status !== "Chờ xét duyệt") {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const startDate = new Date(taskData.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (startDate > now) {
          taskData.status = "Chưa bắt đầu";
        } else {
          taskData.status = "Đang thực hiện";
        }
      }
      const task = await models.tasks.create(taskData);
      await TaskStatusTriggerServices.onTaskChanged(task.taskId);
      return task;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async delete(taskId) {
    try {
      const task = await models.tasks.findByPk(taskId, {
        include: [
          {
            model: models.workflows,
            as: "workflow",
          },
        ],
      });
      if (!task) {
        return {
          success: false,
          message: "Không tìm thấy công việc",
        };
      }
      const workflowId = task.workflowId;
      const deleteRow = await models.tasks.destroy({
        where: { taskId },
      });
      if (deleteRow == 0) {
        return {
          success: false,
          message: "Không tìm thấy công việc",
        };
      }
      await TaskStatusTriggerServices.onDeleteTask(workflowId);
      return {
        success: true,
        message: "Xóa công việc thành công",
      };
    } catch (error) {
      if (error.name === "SequelizeForeignKeyConstraintError") {
        return {
          success: false,
          message:
            "Không thể xóa vì người dùng đang được liên kết với dữ liệu khác (task, project...)",
        };
      }
      return {
        success: false,
        message: "Lỗi server khi xóa công việc",
        error: error.message,
      };
    }
  }

  static async getTaskId(taskId) {
    try {
      const task = models.tasks.findOne({
        where: { taskId },
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
          {
            model: models.attend,
            as: "createBy_attend",
          },
        ],
      });
      return task;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async update(taskId, newData) {
    try {
      const [updateRow] = await models.tasks.update(newData, {
        where: { taskId },
      });
      if (updateRow > 0 && newData.status) {
        await TaskStatusTriggerServices.onTaskChanged(taskId);
      }
      return updateRow > 0;
    } catch (error) {
      console.log(error);
    }
  }

  static async getAllTask() {
    try {
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
      return tasks;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getTaskByWorkflowId(workflowId) {
    try {
      const tasks = await models.tasks.findAll({
        where: { workflowId },
      });
      return tasks;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async updateStatus(taskId, status) {
    try {
      const [updateStatus] = await models.tasks.update(
        { status: status },
        { where: { taskId } }
      );
      if (updateStatus > 0) {
        await TaskStatusTriggerServices.onTaskChanged(taskId);
      }

      return updateStatus > 0;
    } catch (error) {
      console.log(error);
    }
  }

  static async getProjectByTaskId(taskId) {
    try {
      const project = await models.tasks.findOne({
        where: { taskId },
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
      return project;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getTaskByProjectId(projectId) {
    try {
      const task = await models.tasks.findAll({
        include: [
          {
            model: models.workflows,
            as: "workflow",
            where: { projectId },
            include: [
              {
                model: models.projects,
                as: "project",
              },
            ],
          },
          {
            model: models.taskuser,
            as: "taskusers",
            include: [
              {
                model: models.attend,
                as: "attend",
                include: [
                  {
                    model: models.users,
                    as: "user",
                  },
                ],
              },
            ],
          },
        ],
      });
      const result = task.map((item) => ({
        taskId: item.taskId,
        title: item.title,
        startDate: item.startDate,
        endDate: item.endDate,
        status: item.status,
        workflowId: item.workflowId,
        worklfowName: item.workflow?.name,
        projectId: item.workflow.projectId,
        taskusers: [item.taskusers],
      }));

      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  static async getTaskByProjectIdUserId(projectId, userId) {
    try {
      const task = await models.tasks.findAll({
        include: [
          {
            model: models.workflows,
            as: "workflow",
            where: { projectId },
            include: [
              {
                model: models.projects,
                as: "project",
              },
            ],
          },
          {
            model: models.taskuser,
            as: "taskusers",
            required: true,
            include: [
              {
                model: models.attend,
                as: "attend",
                required: true,
                where: { userId },
                include: [
                  {
                    model: models.users,
                    as: "user",
                  },
                ],
              },
            ],
          },
        ],
      });
      const result = task.map((item) => ({
        taskId: item.taskId,
        title: item.title,
        startDate: item.startDate,
        endDate: item.endDate,
        status: item.status,
        workflowId: item.workflowId,
        worklfowName: item.workflow?.name,
        projectId: item.workflow.projectId,
        taskusers: [item.taskusers],
      }));

      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async searchTaskByProject(projectId, keyword) {
    try {
      const result = await models.tasks.findAll({
        include: [
          {
            model: models.workflows,
            as: "workflow",
            where: { projectId },
          },
        ],
        where: {
          [Op.or]: [
            { title: { [Op.like]: `%${keyword}%` } },
            { description: { [Op.like]: `%${keyword}%` } },
            { "$workflow.name$": { [Op.like]: `%${keyword}%` } },
          ],
        },
      });
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getTaskByProjecNotAssignedUser(projectId, attendId) {
    try {
      const task = await models.tasks.findAll({
        include: [
          {
            model: models.workflows,
            as: "workflow",
            where: { projectId },
          },
          {
            model: models.taskuser,
            as: "taskusers",
            where: {
              attendId: attendId,
            },
            required: false,
          },
        ],
        where: {
          "$taskusers.attendId$": { [Op.is]: null },
        },
      });
      const result = task.map((item) => ({
        taskId: item.taskId,
        title: item.title,
        startDate: item.startDate,
        endDate: item.endDate,
        status: item.status,
        workflowId: item.workflowId,
        worklfowName: item.workflow?.name,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async searchTask(keyword) {
    try {
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
        where: {
          [Op.or]: [
            { title: { [Op.like]: `%${keyword}%` } },
            { description: { [Op.like]: `%${keyword}%` } },
            { "$workflow.name$": { [Op.like]: `%${keyword}%` } },
            { "$workflow.project.name$": { [Op.like]: `%${keyword}%` } },
          ],
        },
      });
      const result = tasks.map((t) => ({
        taskId: t.taskId,
        title: t.title,
        description: t.description,
        startDate: t.startDate,
        endDate: t.endDate,
        workflowName: t.workflow?.name,
        projectName: t.workflow?.project?.name,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = TaskController;
