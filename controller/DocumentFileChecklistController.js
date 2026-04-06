const { where } = require("sequelize");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const models = initModels(sequelize);

class DocumentFileChecklistController {
  static async insert(newData, transaction = {}) {
    try {
      const newRow = await models.documentfilechecklist.create(
        newData,
        transaction
      );
      return newRow;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  static async delete(fileId, transactionOption = {}) {
    try {
      const deleteRow = await models.documentfilechecklist.destroy({
        where: { fileId }, transactionOption
      });
      return deleteRow > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  static async getDocumentById(fileId) {
    try {
      const document = await models.documentfilechecklist.findOne({
        where: { fileId },
      });
      return document;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  static async getDocumentAll() {
    try {
      const document = await models.documentfilechecklist.findAll({
        include: [
          {
            model: models.tasks,
            as: "task",
          },
          {
            model: models.attend,
            as: "createBy_attend",
            include: [
              {
                model: models.users,
                as: "user",
              },
            ],
          },
        ],
      });
      const result = document.map((item) => ({
        fileId: item.fileId,
        fileUrl: item.fileUrl,
        createAt: item.createAt,
        taskId: item.taskId,
        taskName: item.task?.title,
        createById: item.createBy,
        createBy: item.createBy_attend?.user?.fullname,
        avatar: item.createBy_attend?.user?.imgUrl,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  static async getDocumentByTaskId(taskId) {
    try {
      const document = await models.documentfilechecklist.findAll({
        where: { taskId },
        include: [
          {
            model: models.tasks,
            as: "task",
          },
          {
            model: models.attend,
            as: "createBy_attend",
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
      const result = document.map((item) => ({
        fileId: item.fileId,
        fileUrl: item.fileUrl,
        title: item.title,
        createAt: item.createAt,
        taskId: item.taskId,
        taskName: item.task?.title,
        createById: item.createBy,
        createBy: item.createBy_attend?.user?.fullname,
        email: item.createBy_attend?.user?.email,
        roleId: item.createBy_attend?.roleId,
        roleName: item.createBy_attend?.role?.rolename,
        avatar: item.createBy_attend?.user?.imgUrl,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = DocumentFileChecklistController;
