const { where, Op } = require("sequelize");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const workflows = require("../models/workflows");
const models = initModels(sequelize);

class WorkflowController {
  static async insert(workflowData) {
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const startDate = new Date(workflowData.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (startDate > now) {
        workflowData.status = "Chưa bắt đầu";
      } else {
        workflowData.status = "Đang thực hiện";
      }
      const workflow = await models.workflows.create(workflowData);
      return workflow;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async delete(workflowId) {
    try {
      const deleteRow = await models.workflows.destroy({
        where: { workflowId },
      });
      if (deleteRow == 0) {
        return {
          success: false,
          message: "Không tìm thấy giai đoán",
        };
      }
      return {
        success: true,
        message: "Xóa giai đoạn thành công",
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
        message: "Lỗi server khi xóa giai đoạn",
        error: error.message,
      };
    }
  }

  static async updateWorkflow(workflowId, newData) {
    try {
      delete newData.status;
      const [updateRow] = await models.workflows.update(newData, {
        where: { workflowId },
      });
      return updateRow > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async getWorkflowId(workflowId) {
    try {
      const workflow = await models.workflows.findOne({
        where: { workflowId },
        include: [
          {
            model: models.projects,
            as: "project",
          },
          {
            model: models.tasks,
            as: "tasks",
          },
          {
            model: models.reports,
            as: "reports",
          },
        ],
      });
      return workflow;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getALlWorkflow() {
    try {
      const workflows = await models.workflows.findAll({
        include: [
          {
            model: models.projects,
            as: "project",
          },
          {
            model: models.tasks,
            as: "tasks",
          },
          {
            model: models.reports,
            as: "reports",
          },
        ],
      });
      const result = workflows.map((item) => ({
        workflowId: item.workflowId,
        name: item.name,
        startDate: item.startDate,
        endDate: item.endDate,
        process: item.process,
        status: item.status,
        progress: item.progress,
        createAt: item.createAt,
        projectId: item.projectId,
        projectName: item.project?.name,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getWorkflowbyProject(projectId, limit, offset) {
    try {
      const query = {
        where: { projectId },
        distinct: true,
        include: [
          { model: models.tasks, as: "tasks" },
          { model: models.reports, as: "reports" },
        ],
      };

      if (!isNaN(limit) && limit != null && !isNaN(offset) && offset != null) {
        query.limit = Number(limit);
        query.offset = Number(offset);
      }

      const { count, rows } = await models.workflows.findAndCountAll(query);

      return {
        total: count,
        workflows: rows,
      };
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async searchWorkflowByProject(projectId, keyword) {
    try {
      const result = await models.workflows.findAll({
        where: {
          projectId,
          [Op.or]: [{ name: { [Op.like]: `%${keyword}%` } }],
        },
      });

      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async searchWorkflow(keyword) {
    try {
      const workflows = await models.workflows.findAll({
        include: [
          {
            model: models.projects,
            as: "project",
          },
        ],
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${keyword}%` } },
            { "$project.name$": { [Op.like]: `%${keyword}%` } },
          ],
        },
      });
      const result = workflows.map((w) => ({
        workflowId: w.workflowId,
        name: w.name,
        projectName: w.project?.name,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
module.exports = WorkflowController;
