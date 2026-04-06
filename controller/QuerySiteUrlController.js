const { where } = require("sequelize");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const handleID = require("../middleware/handleID");
const models = initModels(sequelize);

class QuerySiteController {
  static async getQueryByProject(projectId) {
    try {
      const query = await models.queryfollow.findAll({
        include: [
          {
            model: models.siteurl,
            as: "site",
            include: [
              {
                model: models.projects,
                as: "project",
                where: { projectId },
              },
            ],
          },
        ],
      });
      return query;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async insert(newData) {
    try {
      newData.queryId = handleID("QRF");
      newData.createAt = new Date();
      const newRow = await models.queryfollow.create(newData);
      return {
        success: true,
        message: "Thêm thành công",
      };
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return {
          success: false,
          message: "Từ khóa đã tồn tại",
        };
      }
      return {
        success: false,
        message: "Thêm thất bại",
      };
    }
  }

  static async getQueryById(queryId) {
    try {
      const query = await models.queryfollow.findByPk(queryId);
      return query;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async delete(queryId) {
    try {
      const deleted = await models.queryfollow.destroy({ where: {queryId} });
      return deleted > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}

module.exports = QuerySiteController;
