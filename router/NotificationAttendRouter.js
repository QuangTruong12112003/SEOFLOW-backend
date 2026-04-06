const express = require("express");
const checkToken = require("../middleware/checkToken");
const NotificationAttendController = require("../controller/NotificationAttendController");
const ProjectController = require("../controller/ProjectController");
const AttendController = require("../controller/AttendController");
const router = express.Router();

router.get("/", checkToken(), async (req, res) => {
  try {
    const user = req.user;
    const notification = await NotificationAttendController.getNotificationUser(
      user.userId
    );
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không có dữ liệu",
      });
    }
    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.put("/updateStatus", checkToken(), async (req, res) => {
  try {
    const { projectId, notificationId } = req.query;
    const user = req.user;
    if (!projectId || !notificationId) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const project = await ProjectController.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Không tim thấy dữ liệu",
      });
    }
    const attend = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      projectId
    );
    const updateRow =
      await NotificationAttendController.updateStatusNotificationByUserNoti(
        attend.attendId,
        notificationId
      );
    if (!updateRow) {
      return res.status(400).json({
        success: false,
        message: "Cập nhật thất bại",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.put("/updateAllStatusNotification", checkToken(), async (req, res) => {
  try {
    const user = req.user;
    const result =
      await NotificationAttendController.updateStatusNotificationAll(
        user.userId
      );
    if (!result) {
      return res.status(400).json({
        success: false,
        message: "Cập nhật thất bại",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.delete("/deleteAllNotification", checkToken(), async (req, res) => {
  try {
    const user = req.user;
    const result = await NotificationAttendController.deleteAllNotification(
      user.userId
    );
    if (!result) {
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

router.delete(
  "/deleteAllNotificationInProject",
  checkToken(),
  async (req, res) => {
    try {
      const { projectId } = req.query;
      const user = req.user;
      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
        });
      }
      const attend = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        projectId
      );
      if (!attend) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
        });
      }
      const result =
        await NotificationAttendController.deleteAllNotificationInProject(
          projectId,
          attend.attendId
        );
      if (!result) {
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
  }
);

module.exports = router;
