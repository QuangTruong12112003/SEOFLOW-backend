const { where } = require("sequelize");
const sequelize = require("../config/database");
const handleID = require("../middleware/handleID");
const initModels = require("../models/init-models");
const models = initModels(sequelize);

class SiteUrlController {
  static async insertSiteUrl(newData) {
    try {
      newData.siteId = handleID("STU");
      const newRow = await models.siteurl.create(newData);
      return newRow;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  static async updateStiteUrl(siteId, newData) {
    try {
      const updateRow = await models.siteurl.update(newData, {
        where: { siteId },
      });
      return updateRow > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  static async getSiteUrlByProjectId(projectId) {
    try {
      const siteUrl = await models.siteurl.findOne({
        where: { projectId },
        include: [
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
        ],
      });
      return siteUrl;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  static async getSiteUrlById(siteId) {
    try {
      const siteUrl = await models.siteurl.findOne({
        where: { siteId },
        include: [
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
        ],
      });
      return siteUrl;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  static async deleteSiteUrl(siteId) {
    try {
      const deleteRow = await models.siteurl.destroy({
        where : {siteId}
      });
      return deleteRow > 0;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = SiteUrlController;
