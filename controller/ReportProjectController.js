const { where, Op } = require("sequelize");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const models = initModels(sequelize);

class ReportProjectController {
  static async insertReportProject(newData, transactionOption = {}) {
    try {
      newData.objectId = "project";
      newData.workflowId = null;
      newData.taskId = null;
      const newRow = await models.reports.create(newData, transactionOption);
      return newRow;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async deleteReportProject(reportId, transactionOption = {}) {
    try {
      const deleteRow = await models.reports.destroy({
        where: { reportId },
        transactionOption,
      });
      return deleteRow > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async getReportById(reportId) {
    try {
      const report = await models.reports.findOne({
        where: { reportId, objectId: "project" },
        include: [
          {
            model: models.projects,
            as: "project",
          },
        ],
      });
      return report;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getReportId(reportId) {
    try {
      const report = await models.reports.findOne({
        where: { reportId },
      });
      return report;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async updateReportProject(reportId, newData, options = {}) {
    try {
      newData.objectId = "project";
      newData.workflowId = null;
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

  static async getReportProjectPublic(projectId) {
    try {
      const report = await models.reports.findAll({
        where: {
          objectId: "project",
          visibility: "public",
          projectId,
        },
        include: [
          {
            model: models.projects,
            as: "project",
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
        projectId: item.projectId,
        projectName: item.project?.name,
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

  static async getReportProjectByUser(userId, projectId) {
    try {
      const report = await models.reports.findAll({
        where: {
          objectId: "project",
          projectId,
          createBy: userId,
        },
        include: [
          {
            model: models.projects,
            as: "project",
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
        projectId: item.projectId,
        projectName: item.project?.name,
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

  static async getRpeortProjectByProjectId(projectId) {
    try {
      const report = await models.reports.findAll({
        where: {
          objectId: "project",
          projectId,
        },
        include: [
          {
            model: models.projects,
            as: "project",
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
        projectId: item.projectId,
        projectName: item.project?.name,
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

  static async getReportPrject() {
    try {
      const report = await models.reports.findAll({
        where: { objectId: "project" },
        include: [
          {
            model: models.projects,
            as: "project",
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
        projectId: item.projectId,
        projectName: item.project?.name,
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

  static async searchReportProject(projectId, keyworld) {
    try {
      const reports = await models.reports.findAll({
        include: [
          {
            model: models.workflows,
            as: "workflow",
          },
          {
            model: models.tasks,
            as: "task",
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
        where: {
          [Op.or]: [
            { projectId: projectId, title: { [Op.like]: `%${keyworld}%` } },
            {
              "$workflow.projectId$": projectId,
              title: { [Op.like]: `%${keyworld}%` },
            },
            {
              "$task.workflow.projectId$": projectId,
              title: { [Op.like]: `%${keyworld}%` },
            },
          ],
        },
      });
      return reports;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getAllReportProjet(projectId) {
    try {
      const reports = await models.reports.findAll({
        include: [
          {
            model: models.workflows,
            as: "workflow",
          },
          {
            model: models.tasks,
            as: "task",
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
        where: {
          [Op.or]: [
            { projectId: projectId },
            {
              "$workflow.projectId$": projectId,
            },
            {
              "$task.workflow.projectId$": projectId,
            },
          ],
        },
      });
      return reports;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  static async getAllReportProjetPublicForGuest(projectId) {
    try {
      const reports = await models.reports.findAll({
        where: { visibility: "public" },
        include: [
          {
            model: models.workflows,
            as: "workflow",
          },
          {
            model: models.tasks,
            as: "task",
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
        where: {
          [Op.or]: [
            { projectId: projectId },
            {
              "$workflow.projectId$": projectId,
            },
            {
              "$task.workflow.projectId$": projectId,
            },
          ],
        },
      });
      const result = reports.map((item) => ({
        reportId : item.reportId,
        title: item.title,
        createAt: item.createAt,
        createBy: item.createBy_attend?.user?.fullname,
        objectId: item.objectId,
        reportUrl: item.reportUrl,
        workflowName: item.workflow?.name,
        titleTask: item.task?.title
      }))
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  static async searchReport(keyword) {
    try {
      const report = await models.reports.findAll({
        include: [
          {
            model: models.projects,
            as: "project",
          },
          {
            model: models.workflows,
            as: "workflow",
          },
          {
            model: models.tasks,
            as: "task",
          },
        ],
        where: {
          [Op.or]: [
            { title: { [Op.like]: `%${keyword}%` } },
            { "$project.name$": { [Op.like]: `%${keyword}%` } },
            { "$workflow.name$": { [Op.like]: `%${keyword}%` } },
            { "$task.title$": { [Op.like]: `%${keyword}%` } },
          ],
        },
      });
      const result = report.map((r) => ({
        reportId: r.reportId,
        title: r.title,
        objectBy: r.project?.name || r.workflow?.name || r.task?.title,
        reportUrl: r.reportUrl,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = ReportProjectController;
