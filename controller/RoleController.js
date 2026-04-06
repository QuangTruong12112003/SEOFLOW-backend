const sequelize = require("../config/database");
const iniModels = require("../models/init-models");
const models = iniModels(sequelize);

class RoleController {
    static async getAllRole(){
        try {
            const role = await models.roles.findAll();
            return role;
            
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

module.exports = RoleController