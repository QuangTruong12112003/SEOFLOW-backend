const sequelize = require("../config/database");
const initModels = require("../models/init-models");

const models = initModels(sequelize);

class FieldController {
    static async getAll(){
        try {
            const field = await models.field.findAll();
            return field;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
}

module.exports = FieldController