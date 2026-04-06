const { where, Op } = require("sequelize");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const attend = require("../models/attend");
const models = initModels(sequelize);

class AttendController {
  static async insert(attendId, userId, roleId, projectId) {
    try {
      const newRow = await models.attend.create({
        attendId,
        roleId,
        userId,
        projectId,
        attendAt: new Date(),
      });
      return newRow;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getRoleIdByUserIdProjectId(userId, projectId) {
    try {
      const result = await models.attend.findOne({
        where: { projectId, userId },
        include: [
          {
            model: models.users,
            as: "user",
          },
          {
            model: models.projects,
            as: "project",
          },
        ],
      });
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getAttendById(attendId) {
    try {
      const result = await models.attend.findOne({
        where: { attendId },
        include: [
          {
            model: models.users,
            as: "user",
          },
        ],
      });
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async delete(attendId) {
    try {
      const deleteRow = await models.attend.destroy({
        where: { attendId },
      });
      if (deleteRow === 0) {
        return {
          success: false,
          message: "Không tìm thấy người dùng",
        };
      }
      return {
        success: true,
        message: "Xóa người dùng thành công",
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
        message: "Lỗi server khi xóa người dùng",
        error: error.message,
      };
    }
  }

  static async deleteAttendByProjectId(projectId) {
    try {
      const deleteRow = await models.attend.destroy({
        where: { projectId },
      });
      if (deleteRow === 0) {
        return {
          success: false,
          message: "Không tìm thấy người dùng",
        };
      }
      return {
        success: true,
        message: "Xóa người dùng thành công",
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
        message: "Lỗi server khi xóa người dùng",
        error: error.message,
      };
    }
  }

  static async changeRole(attendId, newRoleId) {
    try {
      const [updateRow] = await models.attend.update(
        { roleId: newRoleId },
        { where: { attendId } }
      );
      return updateRow > 0;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getMember(attendId) {
    try {
      const member = await models.attend.findOne({
        where: {
          attendId,
        },
      });
      return member !== null;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async getUserRoleByProjectId(projectId) {
    try {
      const userRole = await models.attend.findAll({
        where: { projectId },
        include: [
          {
            model: models.users,
            as: "user",
          },
          {
            model: models.roles,
            as: "role",
          },
          {
            model: models.projects,
            as: "project",
          },
        ],
      });
      const result = userRole.map((item) => ({
        attendId: item.attendId,
        projectId: item.projectId,
        projectName: item.project?.name,
        userId: item.userId,
        fullName: item.user?.fullname,
        email: item.user?.email,
        avatar: item.user?.imgUrl,
        roleId: item.roleId,
        roleName: item.role?.rolename,
        projectCreateBy: item.project?.createBy,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getProjectByUserId(userId) {
    try {
      const projects = await models.attend.findAll({
        where: { userId },
        include: [
          {
            model: models.users,
            as: "user",
          },
          {
            model: models.projects,
            as: "project",
            include: [
              {
                model: models.users,
                as: "createBy_user",
              },
            ],
          },
          {
            model: models.roles,
            as: "role",
          },
        ],
      });
      const result = projects.map((item) => ({
        projectId: item.projectId,
        projectName: item.project?.name,
        status: item.project?.status,
        startDate: item.project?.startDate,
        progress: item.project?.progress,
        endDate: item.project.endDate,
        userId: item.userId,
        fullName: item.user?.fullname,
        createBy: item.project?.createBy_user?.userId,
        createByFullname: item.project?.createBy_user?.fullname,
        createByEmail: item.project?.createBy_user?.email,
        roleId: item.roleId,
        roleName: item.role?.rolename,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getUserByProjectIdRoleId(projectId, roleId) {
    try {
      const users = await models.attend.findAll({
        where: { projectId, roleId },
        include: [
          {
            model: models.users,
            as: "user",
          },
          {
            model: models.projects,
            as: "project",
          },
          {
            model: models.roles,
            as: "role",
          },
        ],
      });
      const result = users.map((item) => ({
        projectId: item.projectId,
        projectName: item.project?.name,
        userId: item.userId,
        fullName: item.user?.fullname,
        email: item.user?.email,
        roleId: item.roleId,
        roleName: item.role?.rolename,
        attendId: item.attendId,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async findAttendByProject(projectId, keyword) {
    try {
      const result = await models.attend.findAll({
        where: { projectId },
        include: [
          {
            model: models.users,
            as: "user",
            required: false,
          },
          {
            model: models.roles,
            as: "role",
            required: false,
          },
        ],
        where: {
          projectId,
          [Op.or]: [
            { "$user.fullname$": { [Op.like]: `%${keyword}%` } },
            { "$user.email$": { [Op.like]: `%${keyword}%` } },
            { "$role.rolename$": { [Op.like]: `%${keyword}%` } },
          ],
        },
      });
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getUserByAttendId(attendId) {
    try {
      const user = await models.attend.findOne({
        where: {
          attendId,
        },
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
      });

      return user;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async searchProjectByUserId(userId, keyword) {
    try {
      const projects = await models.attend.findAll({
        include: [
          {
            model: models.users,
            as: "user",
          },
          {
            model: models.projects,
            as: "project",
            include: [
              {
                model: models.users,
                as: "createBy_user",
              },
            ],
          },
          {
            model: models.roles,
            as: "role",
          },
        ],
        where: { userId, 
          [Op.or] : [
            { "$project.name$": { [Op.like]: `%${keyword}%` } },
            {"$project.goal$" : {[Op.like] : `%${keyword}%`}}
          ]
         },
      });

      const result = projects.map((item) => ({
        projectId: item.projectId,
        projectName: item.project?.name,
        goal : item.project?.goal,
        status: item.project?.status,
        startDate: item.project?.startDate,
        progress: item.project?.progress,
        endDate: item.project.endDate,
        userId: item.userId,
        fullName: item.user?.fullname,
        createBy: item.project?.createBy_user?.userId,
        createByFullname: item.project?.createBy_user?.fullname,
        createByEmail: item.project?.createBy_user?.email,
        roleId: item.roleId,
        roleName: item.role?.rolename,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getProjecByUserGuest(userId){
    try {
      const projects = await models.attend.findAll({
        where: {
          userId,
          roleId: 'GUEST'
        },
        include: [
          {
            model : models.projects,
            as: "project",
          }
        ]
      });
      const result = projects.map((item) => ({
        projectId: item.projectId,
        projectName: item.project?.name,
        status: item.project?.status,
        progress: item.project?.progress,
        startDate: item.project?.startDate,
        endDate: item.project?.endDate,
        goal: item.project?.goal,
      }))
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = AttendController;
