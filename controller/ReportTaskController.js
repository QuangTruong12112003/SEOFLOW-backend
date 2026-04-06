const { where } = require("sequelize");
const sequelize = require("../config/database");
const iniModels = require("../models/init-models");
const models = iniModels(sequelize);

class ReportTaskController {
  static async insertReportTask(newData) {
    try {
      newData.objectId = "task";
      newData.projectId = null;
      newData.workflowId = null;
      const newRow = models.reports.create(newData);
      return newRow;
    } catch (error) {
      throw error
    }
  }

  static async deleteReportTask(reportId) {
    try {
      const deleteRow = await models.reports.destroy({
        where: {
          objectId: "task",
          reportId: reportId,
        },
      });
      return deleteRow > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async getReportTaskById(reportId) {
    try {
      const report = await models.reports.findOne({
        where: {
          objectId: "task",
          reportId: reportId,
        },
      });
      return report;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async updateReportTask(reportId, newData, options = {}) {
    try {
      newData.projectId = null;
      newData.workflowId = null;
      const [updateReport] = await models.reports.update(newData, {
        where: { objectId: "task", reportId },
        ...options,
      });
      return updateReport > 0;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getReportTaskAll() {
    try {
      const report = await models.reports.findAll({
        where: {
          objectId: "task",
        },
        include: [
          {
            model: models.attend,
            as: "createBy_attend",
            include: [
              {
                model: models.users,
                as: "user",
              },
            ],
          },
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
        ],
      });
      const result = report.map((item) => ({
        reportId: item.reportId,
        title: item.title,
        date: item.date,
        visibility: item.visibility,
        reportUrl: item.reportUrl,
        createById: item.createBy,
        createBy: item.createBy_attend?.user?.fullname,
        email: item.createBy_attend?.user?.email,
        taskId: item.taskId,
        taskTitle: item.task?.title,
        workflowId: item.task?.workflowId,
        workflowName: item.task?.workflow?.name,
        projectId: item.task?.workflow?.projectId,
        projectName: item.task?.workflow?.project?.name,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getReportTaskPublicByTaskId(taskId) {
    try {
      const report = await models.reports.findAll({
        where: {
          objectId: "task",
          taskId: taskId,
          visibility: "public",
        },
        include: [
          {
            model: models.users,
            as: "createBy_user",
          },
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
        ],
      });
      const result = report.map((item) => ({
        reportId: item.reportId,
        title: item.title,
        createAt: item.date,
        visibility: item.visibility,
        reportUrl: item.reportUrl,
        createById: item.createBy,
        createBy: item.createBy_user?.fullname,
        email: item.createBy_user?.email,
        taskId: item.taskId,
        taskTitle: item.task?.title,
        workflowId: item.task?.workflowId,
        workflowName: item.task?.workflow?.name,
        projectId: item.task?.workflow?.projectId,
        projectName: item.task?.workflow?.project?.name,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getReportTaskByProjectId(projectId) {
    try {
      const report = await models.reports.findAll({
        where: { objectId: "task" },
        include: [
          {
            model: models.tasks,
            as: "task",
            required: true,
            include: [
              {
                model: models.workflows,
                as: "workflow",
                required: true,
                where: { projectId },
              },
            ],
          },
          {
            model: models.attend,
            as: "createBy_attend",
            include: [
              {
                model: models.users,
                as: "user",
              },
            ],
          },
        ],
      });
      const result = report.map((item) => ({
        reportId: item.reportId,
        title: item.title,
        date: item.date,
        visibility: item.visibility,
        reportUrl: item.reportUrl,
        createById: item.createBy,
        createBy: item.createBy_attend?.user?.fullname,
        email: item.createBy_attend?.user?.email,
        taskId: item.taskId,
        taskTitle: item.task?.title,
        workflowId: item.task?.workflowId,
        workflowName: item.task?.workflow?.name,
        projectId: item.task?.workflow.projectId,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getReportTaskByTaskId(taskId) {
    try {
      const report = await models.reports.findAll({
        where: { objectId: "task" },
        include: [
          {
            model: models.tasks,
            as: "task",
            where: { taskId },
            include: [
              {
                model: models.workflows,
                as: "workflow",
              },
            ],
          },
          {
            model: models.attend,
            as: "createBy_attend",
            include: [
              {
                model: models.users,
                as: "user",
              },
            ],
          },
        ],
      });
      const result = report.map((item) => ({
        reportId: item.reportId,
        title: item.title,
        date: item.date,
        visibility: item.visibility,
        reportUrl: item.reportUrl,
        createById: item.createBy,
        createBy: item.createBy_attend?.user?.fullname,
        email: item.createBy_attend?.user?.email,
        taskId: item.taskId,
        taskTitle: item.task?.title,
        workflowId: item.task?.workflowId,
        workflowName: item.task?.workflow?.name,
        projectId: item.task?.workflow.projectId,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getReportTaskPublicByProjectId(projectId) {
    try {
      const report = await models.reports.findAll({
        where: { objectId: "task", visibility: "public" },
        include: [
          {
            model: models.tasks,
            as: "task",
            required: true,
            include: [
              {
                model: models.workflows,
                as: "workflow",
                required: true,
                where: { projectId },
              },
            ],
          },
          {
            model: models.attend,
            as: "createBy_attend",
            include: [
              {
                model: models.users,
                as: "user",
              },
            ],
          },
        ],
      });
      const result = report.map((item) => ({
        reportId: item.reportId,
        title: item.title,
        date: item.date,
        visibility: item.visibility,
        reportUrl: item.reportUrl,
        createById: item.createBy,
        createBy: item.createBy_attend?.user?.fullname,
        email: item.createBy_attend?.user?.email,
        taskId: item.taskId,
        taskTitle: item.task?.title,
        workflowId: item.task?.workflowId,
        workflowName: item.task?.workflow?.name,
        projectId: item.task?.workflow.projectId,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = ReportTaskController;
