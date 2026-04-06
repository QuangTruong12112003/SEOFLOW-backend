const sequelize = require("../config/database");
const handleID = require("../middleware/handleID");
const initModels = require("../models/init-models");
const models = initModels(sequelize);

class ToolController {
  static async insert(formData) {
    try {
      formData.id = handleID("T");
      formData.id.replace(/\d(?=\D*$)/, "");
      const tool = await models.tool.create(formData);
      return tool;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getByPK(id) {
    try {
      const tool = await models.tool.findByPk(id, {
        include: [
          {
            model: models.toolfield,
            as : "toolfields",
            include: [
              {
                model : models.field,
                as: "field"
              }
            ]
          }
        ]
      });
      return tool;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getToolByProject(projectId) {
    try {
      const tools = await models.tool.findAll({
        where: { projectId },
        include: [
          {
            model: models.toolfield,
            as : "toolfields",
            include : [
                {
                    model: models.field,
                    as:"field"
                }
            ]
          },
        ],
      });
      return tools;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async delete(id){
    try {
      const deleteRows = await models.tool.destroy({where : {id}});
      return deleteRows > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}

module.exports = ToolController;
