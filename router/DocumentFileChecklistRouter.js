const express = require("express");
const sequelize = require("../config/database");
const checkToken = require("../middleware/checkToken");
const {
  createUploader,
  handleUploadError,
  safeUploader,
} = require("../middleware/uploadHelper");
const TaskController = require("../controller/TaskController");
const AttendController = require("../controller/AttendController");
const AssignTaskController = require("../controller/AssignTaskController");
const DocumentFileChecklistController = require("../controller/DocumentFileChecklistController");
const RoleProjectPermissiomController = require("../controller/RoleProjectPermissionController");
const path = require("path");
const fs = require("fs");
const NotificationContronller = require("../controller/NotificationController");
const NotificationAttendController = require("../controller/NotificationAttendController");
const { sendMailNotification } = require("../middleware/sendOtp");
require("dotenv").config();
const router = express.Router();

const uploader = createUploader({
  folder: "Documents",
  allowedTypes: [".docx", ".doc", ".xlsm", ".pdf"],
});

const uploadFile = handleUploadError(uploader.single("file"));

router.post("/", checkToken(), uploadFile, async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    await safeUploader(
      req,
      res,
      next,
      async () => {
        const newData = req.body;
        const user = req.user;
        if (!newData.fileId || !newData.taskId) {
          throw new Error("Dữ liệu không hợp lệ");
        }
        const task = await TaskController.getTaskId(newData.taskId);
        if (!task) throw new Error("Không tìm thấy công việc");
        const role = await AttendController.getRoleIdByUserIdProjectId(
          user.userId,
          task.workflow.projectId
        );
        if (user.roleType !== "Admin System") {
          if (!role) {
            throw new Error("Bạn không có quyền");
          }
          const checkIsPermissons =
            await RoleProjectPermissiomController.checkIsPermissons(
              task.workflow.projectId,
              role.roleId,
              "insertDocument"
            );
          if (!checkIsPermissons) throw new Error("Bạn không có quyền");
          if (
            role.roleId === "Content_Writer" ||
            role.roleId === "SEO_Specialist"
          ) {
            const checkExistingUserInTask =
              await AssignTaskController.checkExistingUserInTask(
                newData.taskId,
                user.userId
              );
            if (!checkExistingUserInTask) {
              throw new Error("Bạn không có quyền");
            }
          }
        }
        const attend = await AttendController.getRoleIdByUserIdProjectId(
          user.userId,
          task.workflow.projectId
        );
        if (!req.file) throw new Error("Không có file dữ liệu");
        const file = `/uploads/Documents/${req.file.filename}`;
        newData.fileUrl = file;
        newData.createBy = attend.attendId;
        newData.uploadAt = new Date();
        const newRow = await DocumentFileChecklistController.insert(newData, {
          transaction,
        });
        if (!newRow) throw new Error("Thêm thất bại");
        const notification = await NotificationContronller.insertNotification(
          "Thêm file checklist cho công việc",
          task.workflow.projectId,
          role.attendId,
          { transaction }
        );
        if (!notification) throw new Error("Thêm báo cáo thất bại");
        const assignTasks = await AssignTaskController.getAssignTaskbyTaskId(
          task.taskId
        );
        for (const item of assignTasks) {
          const attend = await AttendController.getAttendById(item.attendId);
          if (!attend) throw new Error("Không tìm thấy dữ liệu");
          if (attend.attendId !== role.attendId) {
            await NotificationAttendController.insertNotificarionAttend(
              notification.notificationId,
              attend.attendId,
              { transaction }
            );

            await sendMailNotification(
              attend.user?.email,
              `${role.user?.fullname} đã thêm một file checklist cho công việc ${task.title} mà bạn được phân công`,
              task.workflow.project.name,
              `${process.env.CLIENT_URL}?projectId=${task.workflow?.projectId}&taskId=${task.taskId}`
            );
          }
        }
        const SEOManager = await AttendController.getUserByProjectIdRoleId(
          task.workflow.projectId,
          "SEO_Manager"
        );
        for (const item of SEOManager) {
          if (item.attendId !== role.attendId) {
            await NotificationAttendController.insertNotificarionAttend(
              notification.notificationId,
              item.attendId,
              { transaction }
            );

            await sendMailNotification(
              item.email,
              `${role.user?.fullname} đã thêm một file checklist cho công việc ${task.title} `,
              task.workflow.project.name,
              `${process.env.CLIENT_URL}?projectId=${task.workflow?.projectId}&taskId=${task.taskId}`
            );
          }
        }
        await transaction.commit();
        return res.status(200).json({
          success: true,
          message: "Thêm thành công",
        });
      },
      {
        folder: "Documents",
      }
    );
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.delete("/:id", checkToken(), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const fileId = req.params.id;
    const user = req.user;
    if (!fileId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const document = await DocumentFileChecklistController.getDocumentById(
      fileId
    );
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài liệu",
      });
    }
    const task = await TaskController.getTaskId(document.taskId);
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
          "deleteDocument"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      if (role.roleId !== "SEO_Manager") {
        if (role.attendId !== document.createBy) {
          return res.status(402).json({
            success: false,
            message: "Bạn không có quyền",
          });
        }
      }
    }
    const filePath = document.fileUrl
      ? path.join(
          __dirname,
          "..",
          "uploads",
          "Documents",
          path.basename(document.fileUrl)
        )
      : null;
    const result = await DocumentFileChecklistController.delete(
      document.fileId,
      { transaction }
    );
    const notification = await NotificationContronller.insertNotification(
      `Xóa tài liệu checklist của công việc ${task.title}`,
      task.workflow.projectId,
      role.attendId,
      { transaction }
    );
    if (!notification) throw new Error("Lỗi thêm thông báo");
    const assignTasks = await AssignTaskController.getAssignTaskbyTaskId(
      task.taskId
    );
    if (!assignTasks) throw new Error("Lỗi tìm danh sách nhân viên");
    for (const item of assignTasks) {
      const attend = await AttendController.getAttendById(item.attendId);
      if (attend.attendId !== role.attendId) {
        await NotificationAttendController.insertNotificarionAttend(
          notification.notificationId,
          attend.attendId,
          { transaction }
        );
        await sendMailNotification(
          attend.user?.email,
          `Tài liệu checklist của dự án ${task.workflow.project.name} trong nhiệm vụ ${task.title} đã bị xóa bởi ${role.user.fullname}`,
          task.workflow.project.name,
          `${process.env.CLIENT_URL}?projectId=${task.workflow?.projectId}&taskId=${task.taskId}`
        );
      }
    }
    const SEOManager = await AttendController.getUserByProjectIdRoleId(
      task.workflow.projectId,
      "SEO_Manager"
    );
    for (const item of SEOManager) {
      if (item.attendId !== role.attendId) {
        await NotificationAttendController.insertNotificarionAttend(
          notification.notificationId,
          item.attendId,
          { transaction }
        );

        await sendMailNotification(
          item.email,
          `${role.user?.fullname} đã thêm một file checklist cho công việc ${task.title} `,
          task.workflow.project.name,
          `${process.env.CLIENT_URL}?projectId=${task.workflow?.projectId}&taskId=${task.taskId}`
        );
      }
    }
    await transaction.commit();
    if (filePath && result) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Lỗi xóa file :", err);
          return res.status(402).json({
            success: false,
            message: "Lỗi xóa file  ",
          });
        } else {
          console.log("Đã xoá :", path.basename(filePath));
        }
      });
    }
    return res.status(200).json({
      success: true,
      message: "Xóa thành công",
    });
  } catch (error) {
    console.log(error);
    await transaction.rollback();
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
    const document = await DocumentFileChecklistController.getDocumentAll();
    return res.status(200).json({
      success: true,
      document,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/getFileByTaskId/:id", checkToken(), async (req, res) => {
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
    }
    const document = await DocumentFileChecklistController.getDocumentByTaskId(
      taskId
    );
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy",
      });
    }
    return res.status(200).json({
      success: true,
      document,
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
