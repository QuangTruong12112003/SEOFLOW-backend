const express = require("express");
const checkToken = require("../middleware/checkToken");
const RoleProjectPermissiomController = require("../controller/RoleProjectPermissionController");
const AttendController = require("../controller/AttendController");
const UserController = require("../controller/UserController");
const handleID = require("../middleware/handleID");
const AssignTaskController = require("../controller/AssignTaskController");
const ProjectController = require("../controller/ProjectController");
const {
  senmdEmailVerifyAccouns,
  sendMailNotification,
} = require("../middleware/sendOtp");
const NotificationContronller = require("../controller/NotificationController");
const sequelize = require("../config/database");
const NotificationAttendController = require("../controller/NotificationAttendController");

const router = express.Router();

router.post("/", checkToken(), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { attendId, projectId, roleId, email } = req.body;
    const userId = req.user.userId;
    const user = req.user;
    if (!projectId || !roleId || !email || !attendId || roleId === "ADMIN") {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const project = await ProjectController.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dự án",
      });
    }
    const role = await AttendController.getRoleIdByUserIdProjectId(
      userId,
      projectId
    );
    if (user.roleType !== "Admin System") {
      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Bạn không nằm trong dự án hoặc dự án không hợp lệ",
        });
      }
      const existsPermission =
        await RoleProjectPermissiomController.checkIsPermissons(
          projectId,
          role.roleId,
          "addMember"
        );
      if (!existsPermission) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    let Member = await UserController.getUserByEmail(email);
    if (!Member) {
      const userData = {
        userId: handleID("USR"),
        email: email,
        status: 0,
      };
      const newRowUsers = await UserController.insertUserEmail(userData);
      if (!newRowUsers) {
        return res.status(400).json({
          success: false,
          message: "Không thể thêm người dùng",
        });
      }
      await senmdEmailVerifyAccouns(email, projectId, project.name);
      Member = newRowUsers;
    }
    const roleprojectuser = await AttendController.getRoleIdByUserIdProjectId(
      Member.userId,
      projectId
    );
    if (roleprojectuser) {
      return res.status(403).json({
        success: false,
        message: "Mỗi người chỉ có một vai trò trong một dự án",
      });
    }
    const newRow = await AttendController.insert(
      attendId,
      Member.userId,
      roleId,
      projectId
    );
    if (!newRow) {
      return res.status(400).json({
        success: false,
        message: "Thêm không thành công",
      });
    }
    const notification = await NotificationContronller.insertNotification(
      "Thư mới tham gia dự án",
      projectId,
      role.attendId,
      { transaction }
    );
    await NotificationAttendController.insertNotificarionAttend(
      notification.notificationId,
      newRow.attendId,
      { transaction }
    );
    await sendMailNotification(
      Member.email,
      `Bạn có đã được thêm vào dự án ${role.project.name} do ${role.user.fullname} quản lý`,
      role.project.name,
      `${process.env.CLIENT_URL}?projectId=${projectId}`
    );
    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: "Thêm thành công",
    });
  } catch (error) {
    await transaction.rollback();
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.delete("/:id", checkToken(), async (req, res) => {
  try {
    const attendId = req.params.id;
    const user = req.user;
    if (!attendId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const attend = await AttendController.getAttendById(attendId);
    if (!attend) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    if (attend.roleId === "ADMIN") {
      return res.status(402).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    if (user.roleType !== "Admin System") {
      const role = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        attend.projectId
      );
      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      const existsPermission =
        await RoleProjectPermissiomController.checkIsPermissons(
          attend.projectId,
          role.roleId,
          "deleteMember"
        );
      if (!existsPermission) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const project = await ProjectController.getProjectById(attend.projectId);
    if (project.createBy === attend.userId) {
      return res.status(402).json({
        success: false,
        message: "Bạn không thể xóa người tạo dự án",
      });
    }
    const deleteRow = await AttendController.delete(attendId);
    const statusCode = deleteRow.success ? 200 : 400;
    return res.status(statusCode).json(deleteRow);
  } catch (error) {
    console.log(error);
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(403).json({
        success: false,
        message:
          "Không thể xóa vì thành viên đang được liên kết với dữ liệu khác (task, project...)",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.put("/changeRole/:id", checkToken(), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const attendId = req.params.id;
    const roleId = req.body.roleId;
    const user = req.user;
    if (!roleId || !attendId || roleId === "ADMIN") {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const attend = await AttendController.getAttendById(attendId);
    if (!attend) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    if (attend.roleId === "ADMIN") {
      return res.status(402).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const project = await ProjectController.getProjectById(attend.projectId);
    const roleprojectuser = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      project.projectId
    );
    if (user.roleType !== "Admin System") {
      if (!roleprojectuser) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      const existsPermission =
        await RoleProjectPermissiomController.checkIsPermissons(
          project.projectId,
          roleprojectuser.roleId,
          "updateRoleMember"
        );
      if (!existsPermission) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    if (roleId === "Guest") {
      const taskuser = await AssignTaskController.getTaskByUserIdProjectId(
        attend.projectId,
        attend.attendId
      );
      if (taskuser.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Bạn không thể cập nhật vai trò thành viên đang đảm nhận nhiệm vụ thành khách hàng",
        });
      }
    }
    const changeRole = await AttendController.changeRole(attendId, roleId);
    if (!changeRole) {
      return res.status(402).json({
        success: false,
        message: "Cập nhật dữ liệu thất bại",
      });
    }
    const notification = await NotificationContronller.insertNotification(
      `Thông báo thay đổi vai cho  ${roleprojectuser.user.fullname}`,
      attend.projectId,
      roleprojectuser.attendId,
      { transaction }
    );

    await NotificationAttendController.insertNotificarionAttend(
      notification.notificationId,
      attend.attendId,
      { transaction }
    );

    await sendMailNotification(
      attend.user.email,
      `Vai trò của bạn trong dự án ${roleprojectuser.project.name} bởi ${roleprojectuser.user.fullname}`,
      roleprojectuser.project.name,
      `${process.env.CLIENT_URL}?projectId=${attend.projectId}`
    );
    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: "Cập nhật vai trò thành công",
    });
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error,
    });
  }
});

router.get("/getUserRoleByProjectId/:id", checkToken(), async (req, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const userRole = await AttendController.getUserRoleByProjectId(projectId);
    return res.status(200).json({
      success: true,
      userRole,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/geRoleByUserIdProjectId/:id", checkToken(), async (req, res) => {
  try {
    const projectId = req.params.id;
    const user = req.user;
    if (!projectId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const userRole = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      projectId
    );
    return res.status(200).json({
      success: true,
      userRole,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/getProjectRoleByUserId/:id", checkToken(), async (req, res) => {
  try {
    const userId = req.params.id;
    const user = req.user;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    if (user.roleType !== "Admin System") {
      if (userId !== user.userId) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const projects = await AttendController.getProjectByUserId(userId);
    return res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/getUserByProjectIdRoleId", checkToken(), async (req, res) => {
  try {
    const { projectId, roleId } = req.query;
    const user = req.user;
    if (!projectId || !roleId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    if (user.roleType !== "Admin System") {
      const existing = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        projectId
      );
      if (!existing) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const users = await AttendController.getUserByProjectIdRoleId(
      projectId,
      roleId
    );
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/findAttendByProject", checkToken(), async (req, res) => {
  try {
    const { projectId, keyWord } = req.query;
    const user = req.user;
    if (!projectId || !keyWord) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const project = await ProjectController.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    if (user.roleType !== "Admin System") {
      const role = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        projectId
      );
      if (!role) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const result = await AttendController.findAttendByProject(
      projectId,
      keyWord
    );
    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/getUserByAttendId/:id", checkToken(), async (req, res) => {
  try {
    const attendId = req.params.id;
    const user = req.user;
    if (!attendId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const attend = await AttendController.getAttendById(attendId);
    if (!attend) {
      return res.status(404).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    if (user.roleType !== "Admin System") {
      const role = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        attend.projectId
      );
      if (!role) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const userAttendId = await AttendController.getUserByAttendId(attendId);
    return res.status(200).json({
      success: true,
      user: userAttendId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/searchProjectByUser", checkToken(), async (req, res) => {
  try {
    const { keyword } = req.query;
    const user = req.user;
    const result = await AttendController.searchProjectByUserId(
      user.userId,
      keyword
    );
    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.post("/getProjectByUserGuest", checkToken(), async (req, res) => {
  try {
    const user = req.user;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const projects = await AttendController.getProjecByUserGuest(user.userId);
    if (!projects) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    const result = projects.filter((item) => status.includes(item.status));
    return res.status(200).json({
      success: true,
      projects: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

module.exports = router;
