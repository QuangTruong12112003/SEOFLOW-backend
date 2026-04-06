const { where } = require("sequelize");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const models = initModels(sequelize);

class RoleProjectPermissiomController{
    static async checkIsPermissons(projectId, roleId, permissionId){
        try{
            const result =  await models.roleprojectpermission.findOne({
                where : {
                    projectId,
                    roleId,
                    permissionId
                }
            });
            return result !== null;
        }catch(error){
            console.log(error);
            return false;
        }
    }

    static async insertPermissions(projectId, roleId, permissionId){
        try {
            const newRow = await models.roleprojectpermission.create({
                projectId : projectId,
                roleId : roleId,
                permissionId : permissionId,
                date : new Date()
            });
            return newRow;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    static async deletePermissions(projectId, roleId, permissionId){
        try {
            const deleteRow = await models.roleprojectpermission.destroy({where : {projectId, roleId, permissionId}});
            return deleteRow > 0 ;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    static async getPermissionByProjectIdRoleId(projectId, roleId){
        try {
            const permisions = await models.roleprojectpermission.findAll({
                where : {
                    projectId : projectId,
                    roleId : roleId,
                },
                include : [
                    {
                        model : models.roles,
                        as : "role"
                    },
                    {
                        model : models.permissions,
                        as : "permission"
                    },
                    {
                        model : models.projects,
                        as : "project"
                    }
                ]
            });
            const result = permisions.map(item => ({
                permissionId : item.permissionId,
                permissionsName : item.permission?.actionname,
                roleId : item.roleId,
                roleName : item.role?.rolename,
                projectId : item.projectId,
                projectName : item.project?.name
            }))
            return result;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
}

module.exports = RoleProjectPermissiomController;