const { where, Op } = require("sequelize");
const sequelize = require("../config/database");
const passwordHandler = require("../middleware/passwordHandler");
const initModels = require("../models/init-models");

const models = initModels(sequelize);

class UserController {
  static async insertUser(userData) {
    try {
      if (userData.password) {
        const password = userData.password;
        const hashedPassword = await passwordHandler.hashedPassword(password);
        userData.password = hashedPassword;
      }
      userData.craeteAt = new Date();
      const newUser = await models.users.create(userData);
      return newUser;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async insertUserEmail(userData) {
    try {
      userData.craeteAt = new Date();
      const newUser = await models.users.create(userData);
      return newUser;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async getUserByUsername(username) {
    try {
      const user = await models.users.findOne({
        where: {
          username: username,
        },
      });
      return user;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getUserByEmail(email) {
    try {
      const user = await models.users.findOne({
        where: {
          email: email,
        },
      });
      return user;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async updateUserByEmail(email, formData) {
    try {
      const password = formData.password;
      const hashedPassword = await passwordHandler.hashedPassword(password);
      formData.password = hashedPassword;
      const updateRow = await models.users.update(formData, {
        where: { email },
      });
      return updateRow > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async updateUser(userId, updateData) {
    try {
      if (updateData.password) {
        const password = updateData.password;
        const hashedPassword = await passwordHandler.hashedPassword(password);
        updateData.password = hashedPassword;
      }
      const updateRow = await models.users.update(updateData, {
        where: { userId },
      });
      return updateRow > 0;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  static async getUserById(userId) {
    try {
      const user = await models.users.findOne({
        where: { userId },
        attributes: { exclude: ["password", "roleType"] },
      });
      return user;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async deleteUser(userId) {
    try {
      const deleteRow = await models.users.destroy({ where: { userId } });
      if (deleteRow == 0) {
        return {
          success: false,
          message: "Không tìm thấy người dùng",
        };
      }

      return {
        success: true,
        message: "Xóa người dùng thành công",
      };
    } catch (error) {
      if (error.name === "SequelizeForeignKeyConstraintError") {
        return {
          success: false,
          message:
            "Không thể xóa vì người dùng đang được liên kết với dữ liệu khác (task, project...)",
        };
      }
      return {
        success: false,
        message: "Lỗi server khi xóa người dùng",
        error: error.message,
      };
    }
  }

  static async getEmailroleTypeAdmin(email) {
    try {
      const user = await models.users.findOne({
        where: {
          roleType: "Admin System",
          email: email,
        },
      });
      return user;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async getAllUser() {
    try {
      const users = await models.users.findAll({
        where: { roleType: "user" },
      });
      return users;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async searchUser(keyword){
    try {
      const users = await models.users.findAll({
        where : {
          [Op.or] : [
            {"fullname" : {[Op.like] : `%${keyword}%`}},
            {"email" : {[Op.like] : `%${keyword}%`}},
          ]
        }
      });
      const result = users.map((u) => ({
        userId : u.userId,
        fullname: u.fullname,
        email : u.email,
      }));
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = UserController;
