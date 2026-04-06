const { where } = require("sequelize");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const models = initModels(sequelize);

class ReportWorkflowController {
  static async insertReportWorkflow(newData, transactionOption = {}) {
    try {
      newData.objectId = "workflow";
      newData.projectId = null;
      newData.taskId = null;
      const newRow = await models.reports.create(newData, transactionOption);
      return newRow;
    } catch (error) {
      throw error;
    }
  }

  static async deleteReportWorkflow(reportId, transactionOption = {}) {
    try {
      const deleteRow = await models.reports.destroy({
        where: { reportId },
        transactionOption,
      });
      return deleteRow > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getReportWorkflowId(reportId) {
    try {
      const report = await models.reports.findOne({
        where: { reportId },
        objectId: "workflow",
      });
      return report;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async updateReportWorkflow(reportId, newData, options = {}) {
    try {
      newData.projectId = null;
      newData.taskId = null;
      const [updateRow] = await models.reports.update(newData, {
        where: { reportId },
        ...options,
      });
      return updateRow > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async getReportWorkflowPublic(workflowId) {
    try {
      const report = await models.reports.findAll({
        where: {
          objectId: "workflow",
          visibility: "public",
          workflowId,
        },
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
            model: models.users,
            as: "createBy_user",
          },
        ],
      });
      const result = report.map((item) => ({
        reportId: item.reportId,
        reportUrl: item.reportUrl,
        title: item.title,
        visibility: item.visibility,
        date: item.date,
        workflowId: item.workflowId,
        workflowName: item.workflow?.name,
        projectId: item.workflow?.projectId,
        projectName: item.workflow?.project?.name,
        createById: item.createBy,
        createBy: item.createBy_user?.fullname,
        email: item.createBy_user?.email,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getReportWorkflow() {
    try {
      const report = await models.reports.findAll({
        where: { objectId: "workflow" },
        include: [
          {
            model: models.workflows,
            as: "workflow",
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
        reportUrl: item.reportUrl,
        title: item.title,
        visibility: item.visibility,
        date: item.date,
        workflowId: item.workflowId,
        workflowName: item.workflow?.name,
        createById: item.createBy,
        createBy: item.createBy_attend?.user?.fullname,
        email: item.createBy_attend?.user?.email,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getReportWorkflowByUserId(userId) {
    try {
      const report = await models.reports.findAll({
        where: { objectId: "workflow", createBy: userId },
        include: [
          {
            model: models.workflows,
            as: "workflow",
          },
          {
            model: models.users,
            as: "createBy_user",
          },
        ],
      });
      const result = report.map((item) => ({
        reportId: item.reportId,
        reportUrl: item.reportUrl,
        title: item.title,
        visibility: item.visibility,
        date: item.date,
        workflowId: item.workflowId,
        workflowName: item.workflow?.name,
        createById: item.createBy,
        createBy: item.createBy_user?.fullname,
        email: item.createBy_user?.email,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getReportWorkflowByProjectId(projectId) {
    try {
      const report = await models.reports.findAll({
        where: { objectId: "workflow" },
        include: [
          {
            model: models.workflows,
            as: "workflow",
            where: { projectId },
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
        reportUrl: item.reportUrl,
        title: item.title,
        visibility: item.visibility,
        date: item.date,
        workflowId: item.workflowId,
        workflowName: item.workflow?.name,
        createById: item.createBy,
        createBy: item.createBy_attend?.user?.fullname,
        email: item.createBy_attend?.user?.email,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  static async getReportWorkflowPublicByProjectId(projectId) {
    try {
      const report = await models.reports.findAll({
        where: { objectId: "workflow", visibility: "public" },
        include: [
          {
            model: models.workflows,
            as: "workflow",
            where: { projectId },
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
        reportUrl: item.reportUrl,
        title: item.title,
        visibility: item.visibility,
        date: item.date,
        workflowId: item.workflowId,
        workflowName: item.workflow?.name,
        createById: item.createBy,
        createBy: item.createBy_attend?.user?.fullname,
        email: item.createBy_attend?.user?.email,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = ReportWorkflowController;
