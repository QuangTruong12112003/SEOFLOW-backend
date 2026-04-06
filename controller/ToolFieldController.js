const sequelize = require("../config/database");
const handleID = require("../middleware/handleID");
const initModels = require("../models/init-models");
const models = initModels(sequelize);

class ToolFieldController{
    static async insert(formData){
        try {
            formData.id = handleID("TF");
            const newRow = await models.toolfield.create(formData);
            return newRow;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
    static async delete(id){
        try {
            const deleteRow = await models.toolfield.destroy({where: {id}});
            return deleteRow;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
}

module.exports = ToolFieldController;