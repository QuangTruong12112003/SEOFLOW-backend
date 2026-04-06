const express = require("express");
const checkToken = require("../middleware/checkToken");
const AttendController = require("../controller/AttendController");
const TaskController = require("../controller/TaskController");
const RoleProjectPermissiomController = require("../controller/RoleProjectPermissionController");
const AssignTaskController = require("../controller/AssignTaskController");
const NotificationContronller = require("../controller/NotificationController");
const NotificationAttendController = require("../controller/NotificationAttendController");
const { sendMailNotification } = require("../middleware/sendOtp");
const sequelize = require("../config/database");
require("dotenv").config();

const router = express.Router();

router.post("/", checkToken(), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { attendId, taskId } = req.body;
    const user = req.user;
    if (!attendId || !taskId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const task = await TaskController.getTaskId(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc",
      });
    }
    const role = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      task.workflow.projectId
    );
    if (user.roleType !== "Admin System") {
      if (!role) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      const checkIsPermissons =
        await RoleProjectPermissiomController.checkIsPermissons(
          task.workflow.projectId,
          role.roleId,
          "managerAssignedTask"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const attend = await AttendController.getAttendById(attendId);
    if (!attend) {
      return res.status(404).json({
        success: false,
        message: "Người dùng ngoài dự án",
      });
    }
    if (attend.roleId === "Admin") {
      return res.status(402).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    if (attend.roleId === "Guest") {
      return res.status(402).json({
        success: false,
        message: "Bạn không thêm công việc cho khách hàng của mình",
      });
    }
    const newRow = await AssignTaskController.insertAssignTask(
      attend.attendId,
      task.taskId,
      { transaction }
    );
    if (!newRow) {
      return res.status(400).json({
        success: false,
        message: "Thêm thất bại",
      });
    }
    const notification = await NotificationContronller.insertNotification(
      "Giao việc cho thành viên",
      task.workflow.projectId,
      role.attendId,
      { transaction }
    );
    if (!notification) {
      return res.status(400).json({
        success: false,
        message: "Không thể thêm thông báo",
      });
    }
    await NotificationAttendController.insertNotificarionAttend(
      notification.notificationId,
      attend.attendId,
      { transaction }
    );
    await sendMailNotification(
      attend.user?.email,
      "Bạn được giao một công việc với hãy vào dự án để biết thêm chi tiết",
      task.workflow?.project?.name,
      `${process.env.CLIENT_URL}?projectId=${task.workflow?.projectId}&taskId=${task.taskId}`
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
      messega: "Lỗi server",
    });
  }
});

router.get("/getTaskByUserIdProjectId", checkToken(), async (req, res) => {
  try {
    const { projectId, attendId } = req.query;
    const user = req.user;
    if (!projectId || !attendId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    if (user.roleType !== "Admin System") {
      const role = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        projectId
      );
      if (!role) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const tasks = await AssignTaskController.getTaskByUserIdProjectId(
      projectId,
      attendId
    );
    if (!tasks) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.delete("/", checkToken(), async (req, res) => {
  try {
    const { attendId, taskId } = req.query;
    const user = req.user;
    if (!attendId || !taskId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const task = await TaskController.getTaskId(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc",
      });
    }
    if (user.roleType !== "Admin System") {
      const role = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        task.workflow.projectId
      );
      if (!role) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      const checkIsPermissons =
        await RoleProjectPermissiomController.checkIsPermissons(
          task.workflow.projectId,
          role.roleId,
          "managerAssignedTask"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const deleteRow = await AssignTaskController.deleteAssignTask(
      attendId,
      taskId
    );
    if (!deleteRow) {
      return res.status(400).json({
        success: false,
        message: "Xóa thất bại",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Xóa thành công",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/", checkToken(), async (req, res) => {
  try {
    const user = req.user;
    if (user.roleType !== "Admin System") {
      return res.status(402).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const assignedTasks = await AssignTaskController.getAllAssignTask();
    return res.status(200).json({
      success: true,
      assignedTasks,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/getTaskByUser/", checkToken(), async (req, res) => {
  try {
    const { userId, projectId } = req.query;
    const user = req.user;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    if (user.roleType !== "Admin System" && userId !== user.userId) {
      if (!projectId) {
        return res.status(401).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
        });
      }
      const role = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        projectId
      );
      if (!role) {
        return res.status(401).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      const checkIsPermissons =
        await RoleProjectPermissiomController.checkIsPermissons(
          projectId,
          role.roleId,
          "managerAssignedTask"
        );
      if (!checkIsPermissons) {
        return res.status(401).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const tasks = await AssignTaskController.getAssignTaskbUserId(userId);
    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/getUserByTask/:id", checkToken(), async (req, res) => {
  try {
    const taskId = req.params.id;
    const user = req.user;
    if (!taskId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const task = await TaskController.getTaskId(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc",
      });
    }
    const checkExistingUserInTask =
      await AssignTaskController.checkExistingUserInTask(taskId, user.userId);
    if (user.roleType !== "Admin System" && !checkExistingUserInTask) {
      const role = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        task.workflow.projectId
      );
      if (!role) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const assignedtasks = await AssignTaskController.getAssignTaskbyTaskId(
      taskId
    );
    return res.status(200).json({
      success: true,
      assignedtasks,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/getTaskByCurrentUser", checkToken(), async (req, res) => {
  try {
    const user = req.user;
    const tasks = await AssignTaskController.getAssignTaskbUserId(user.userId);
    if (!tasks) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/searchTaskByUserId", checkToken(), async (req, res) => {
  try {
    const { keyword } = req.query;
    const user = req.user;
    const result = await AssignTaskController.searchTaskByUserId(
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

router.get("/getTaskTimeSuccess/:id", checkToken(), async(req, res) => {
  try {
    const userId = req.params.id;
    const task = await AssignTaskController.getAssignTaskTimeSuccesssbUserId(userId);
    return res.status(200).json({
      success: true,
      task
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server"
    })
  }
})

module.exports = router;
