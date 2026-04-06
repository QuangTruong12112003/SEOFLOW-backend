const { where, Op } = require("sequelize");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const models = initModels(sequelize);
const PermissonsController = require("./PermissionsController");
const handleID = require("../middleware/handleID");
const attend = require("../models/attend");

class ProjectController {
  static async insertProject(projectData) {
    const transaction = await sequelize.transaction();
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const startDate = new Date(projectData.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (startDate > now) {
        projectData.status = "Chưa bắt đầu";
      } else {
        projectData.status = "Đang thực hiện";
      }
      const project = await models.projects.create(projectData, {
        transaction,
      });

      const SEO_Manager = await PermissonsController.getAllPermission();
      const SEO_Specialist = [
        "updateTask",
        "updateStatusTask",
        "viewProject",
        "viewReport",
        "viewTask",
        "viewWorkflow",
        "insertTask",
        "insertReport",
        "updateReport",
        "deleteReport",
        "insertComment",
        "updateComment",
        "deleteComment",
        "insertDocument",
        "deleteDocument",
      ];
      const Content_Manager = [
        "updateTask",
        "updateStatusTask",
        "viewProject",
        "viewReport",
        "viewTask",
        "viewWorkflow",
        "insertTask",
        "insertReport",
        "updateReport",
        "deleteReport",
        "insertComment",
        "updateComment",
        "deleteComment",
        "managerAssignedTask",
        "insertDocument",
        "deleteDocument",
      ];
      const Content_Writer = [
        "viewProject",
        "viewReport",
        "viewTask",
        "viewWorkflow",
        "updateStatusTask",
        "insertReport",
        "updateReport",
        "deleteReport",
        "insertComment",
        "updateComment",
        "deleteComment",
        "insertDocument",
        "deleteDocument",
      ];
      const Guest = [
        "viewProject",
        "viewReport",
        "viewTask",
        "viewWorkflow",
        "insertComment",
        "updateComment",
        "deleteComment",
      ];

      const rolePermissions = {
        SEO_Manager,
        SEO_Specialist,
        Content_Manager,
        Content_Writer,
        Guest,
      };

      for (const [roleId, permissions] of Object.entries(rolePermissions)) {
        for (const permission of permissions) {
          await models.roleprojectpermission.create(
            {
              roleId,
              projectId: project.projectId,
              permissionId: permission,
              date: new Date(),
            },
            { transaction }
          );
        }
      }
      await models.attend.create(
        {
          attendId: handleID("ATD"),
          projectId: project.projectId,
          roleId: "SEO_Manager",
          userId: project.createBy,
          attendAt: new Date(),
        },
        { transaction }
      );
      if (project.createBy !== "USR20250512165856") {
        await models.attend.create(
          {
            attendId: handleID("ATD"),
            projectId: project.projectId,
            roleId: "ADMIN",
            userId: "USR20250512165856",
            attendAt: new Date(),
          },
          { transaction }
        );
      }
      await transaction.commit();
      return project;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async updateProject(projectId, projectData) {
    try {
      if (projectData.startDate) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const startDate = new Date(projectData.startDate);
        startDate.setHours(0, 0, 0, 0);

        projectData.status =
          startDate > now ? "Chưa bắt đầu" : "Đang thực hiện";
      }
      const [updateRow] = await models.projects.update(projectData, {
        where: { projectId },
      });
      return updateRow > 0;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getProjectById(projectId) {
    try {
      const project = await models.projects.findOne({ where: { projectId } });
      return project;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async deleteProject(projectId) {
    const transaction = await sequelize.transaction();
    try {
      await models.attend.destroy({
        where: { projectId },
        transaction,
      });
      const deleteRow = await models.projects.destroy({
        where: { projectId },
        transaction,
      });
      if (deleteRow == 0) {
        return {
          success: false,
          message: "Không tìm thấy dự án",
        };
      }
      await transaction.commit();
      return {
        success: true,
        message: "Xóa dự án thành công",
      };
    } catch (error) {
      await transaction.rollback();
      if (error.name === "SequelizeForeignKeyConstraintError") {
        return {
          success: false,
          message:
            "Không thể xóa vì dự án đang được liên kết với dữ liệu khác (task, project...)",
        };
      }
      return {
        success: false,
        message: "Lỗi server khi xóa người dùng",
        error: error.message,
      };
    }
  }

  static async getAllProject() {
    try {
      const Listproject = await models.projects.findAll();
      return Listproject;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async getProjectById(projectid) {
    try {
      const project = await models.projects.findOne({
        where: { projectid },
        include: [
          {
            model: models.users,
            as: "createBy_user",
          },
        ],
      });

      if (!project) return null;

      const result = {
        projectId: project.projectId,
        name: project.name,
        goal: project.goal,
        progress: project.progress,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        createAt: project.createAt,
        createBy: project.createBy,
        fullname: project.createBy_user?.fullname,
        refreshToken: project.createBy_user?.refreshtoken,
      };

      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async searchProject(keyword) {
    try {
      const projects = await models.projects.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${keyword}%` } },
            { goal: { [Op.like]: `%${keyword}%` } },
          ],
        },
      });
      const result = projects.map((p) => ({
        projectId: p.projectId,
        name: p.name,
        goal: p.goal,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
}

module.exports = ProjectController;
