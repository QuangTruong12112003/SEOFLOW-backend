const { where, Op } = require("sequelize");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const models = initModels(sequelize);

class AttendToolController {
  static async insert(attendId, toolId) {
    try {
      const newRow = await models.toolattend.create({ toolId, attendId });
      return newRow;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async delete(attendId, toolId) {
    try {
      const deleteRow = await models.toolattend.destroy({
        where: { attendId, toolId },
      });
      return deleteRow > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async getToolUseByUser(userId, projectId) {
    try {
      const tools = await models.toolattend.findAll({
        include: [
          {
            model: models.attend,
            as: "attend",
            where: {
              userId,
            },
          },
          {
            model: models.tool,
            as: "tool",
            where: { projectId },
            include: [
              {
                model: models.toolfield,
                as: "toolfields",
                include: [
                  {
                    model: models.field,
                    as: "field",
                  },
                ],
              },
            ],
          },
        ],
      });
      const result = tools.map((t) => ({
        id: t.tool?.id,
        label: t.tool?.label,
        projectId: t.tool?.projectId,
        prompt: t.tool?.prompt,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getToolByid(toolId, offset) {
    try {
      const { count, rows } = await models.toolattend.findAndCountAll({
        where: { toolId },
        limit: 5,
        offset,
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
      const result = rows.map((t) => ({
        attendId: t.attendId,
        toolId: t.toolId,
        fullname: t.attend?.user?.fullname,
        role: t.attend?.role?.rolename,
      }));
      return {
        total: count,
        data: result,
      };
    } catch (error) {
      console.log(error);
    }
  }

  static async getToolByRoleIdAndToolId(toolId, roleId) {
    try {
      const tool = await models.toolattend.findAll({
        where: { toolId },
        include: [
          {
            model: models.attend,
            as: "attend",
            where: { roleId },
          },
        ],
      });
      return tool;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getAttendNotUseToolId(toolId, projectId){
    try {
      const attend = await models.attend.findAll({
        include : [
          {
            model : models.toolattend,
            as : "toolattends",
            where: {toolId},
            required: false
          },
          {
            model: models.users,
            as: "user"
          },
          {
            model: models.roles,
            as: "role"
          }
        ],
        where: {
          [Op.and] : [
            {'$toolattends.toolId$' : null},
            {projectId},
            {roleId : {[Op.notLike] : `Guest`}}
          ]
        }
      });
      const result = attend.map((item) => ({
        attendId: item.attendId,
        projectId: item.projectId,
        roleId: item.roleId,
        fullname: item.user?.fullname,
        rolename: item.role?.rolename
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = AttendToolController;
