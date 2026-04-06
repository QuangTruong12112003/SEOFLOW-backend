const { where } = require("sequelize");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const models = initModels(sequelize);

class CommentController {
  static async insertComment(newDate) {
    try {
      const newRow = models.comments.create(newDate);
      return newRow;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async deleteComment(commentId) {
    try {
      const deleteRow = await models.comments.destroy({ where: { commentId } });
      return deleteRow > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async getCommentById(commentId) {
    try {
      const comment = await models.comments.findOne({
        where: { commentId },
      });
      return comment;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async updateComment(commentId, newData, option = {}) {
    try {
      const [updateRow] = await models.comments.update(newData, {
        where: { commentId },
        ...option,
      });
      return updateRow > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async getCommentByTaskId(taskId) {
    try {
      const comment = await models.comments.findAll({
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
            ],
          },
        ],
      });
      const result = comment.map((item) => ({
        commentId: item.commentId,
        content: item.content,
        fileUrl: item.fileUrl,
        creataAt: item.creataAt,
        createById: item.createBy,
        createBy: item.createBy_attend?.user?.fullname,
        email : item.createBy_attend?.user?.email,
        avatar: item.createBy_attend?.user?.imgUrl,
        taskId: item.taskId,
        userId: item.createBy_attend?.userId,
        task: item.task?.title,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getCommentByUserId(userId) {
    try {
      const comment = await models.comments.findAll({
        include: [
          {
            model: models.tasks,
            as: "task",
          },
          {
            model: models.attend,
            as: "createBy_attend",
            where : {userId},
            include: [
              {
                model: models.users,
                as: "user",
              },
            ],
          },
        ],
      });
      const result = comment.map((item) => ({
        commentId: item.commentId,
        content: item.content,
        fileUrl: item.fileUrl,
        creataAt: item.creataAt,
        createById: item.createBy,
        createBy: item.createBy_attend?.user?.fullname,
        avatar: item.createBy_attend?.user?.imgUrl,
        taskId: item.taskId,
        task: item.task?.title,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = CommentController;
