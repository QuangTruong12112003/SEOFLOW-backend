const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const models = initModels(sequelize);

class Permissons {
    static async getAllPermission() {
        try{
            const permissions = await models.permissions.findAll({
                 attributes: ['permissionId']
            });
            const result = permissions.map(item => item.permissionId);
            return result;
        }catch(error){
            console.log(error);
            return null;
        }
    }

    static async getAllPermissionConfig(){
        try {
            const permissions  = await models.permissions.findAll();
            return permissions;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
}

module.exports = Permissons;