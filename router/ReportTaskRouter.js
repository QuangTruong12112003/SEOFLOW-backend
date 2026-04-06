const express = require("express");
const sequelize = require("../config/database");
const {
  createUploader,
  handleUploadError,
  safeUploader,
} = require("../middleware/uploadHelper");
const checkToken = require("../middleware/checkToken");
const TaskController = require("../controller/TaskController");
const AttendController = require("../controller/AttendController");
const RoleProjectPermissionController = require("../controller/RoleProjectPermissionController");
const ReportTaskController = require("../controller/ReportTaskController");
const AssignTaskController = require("../controller/AssignTaskController");
const ProjectController = require("../controller/ProjectController");
const path = require("path");
const fs = require("fs");
const NotificationContronller = require("../controller/NotificationController");
const NotificationAttendController = require("../controller/NotificationAttendController");
const { sendMailNotification } = require("../middleware/sendOtp");
const router = express.Router();

const uploader = createUploader({
  folder: "ReportTasks",
  allowedTypes: [".docx", ".doc", ".pdf"],
});

const uploadFile = handleUploadError(uploader.single("reportUrl"));

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
        if (!newData.reportId || !newData.title || !newData.taskId || !req.file)
          throw new Error("Dữ liệu không hợp lệ");
        const task = await TaskController.getTaskId(newData.taskId);
        if (!task) throw new Error("Không tìm thấy dữ liệu");
        const role = await AttendController.getRoleIdByUserIdProjectId(
          user.userId,
          task.workflow.projectId
        );
        if (user.roleType !== "Admin System") {
          if (!role) throw new Error("Bạn không có quyền");
          const checkPermissiom =
            await RoleProjectPermissionController.checkIsPermissons(
              task.workflow.projectId,
              role.roleId,
              "insertReport"
            );
          if (!checkPermissiom) throw new Error("Bạn không có quyền");
          const checkExistingUser =
            await AssignTaskController.checkExistingUserInTask(
              task.taskId,
              user.userId
            );
          if (role.roleId === "SEO_Specialist") {
            if (!checkExistingUser && task.createBy !== user.userId)
              throw new Error("Bạn không có quyền");
          }
          if (role.roleId === "Content_Writer") {
            if (!checkExistingUser) throw new Error("Bạn không có quyền");
          }
        }
        const filePath = `/uploads/ReportTasks/${req.file.filename}`;
        newData.reportUrl = filePath;
        newData.createBy = role.attendId;
        newData.date = new Date();
        const newRow = await ReportTaskController.insertReportTask(newData);
        if (!newRow) throw new Error("Thêm thất bại");
        const notification = await NotificationContronller.insertNotification(
          "Thông báo thêm báo cáo công việc",
          task.workflow.projectId,
          role.attendId,
          { transaction }
        );
        const attends = await AttendController.getUserRoleByProjectId(
          task.workflow.projectId
        );
        for (const item of attends) {
          if (item.attendId !== role.attendId && item.roleId !== "Guest") {
            await NotificationAttendController.insertNotificarionAttend(
              notification.notificationId,
              item.attendId,
              { transaction }
            );

            await sendMailNotification(
              item.email,
              `${task.title} thuộc dự án ${task.workflow.project.name} đã được thêm một báo cáo mới bởi ${user.fullname}`,
              task.workflow.project.name,
              `${process.env.CLIENT_URL}?projectId=${task.workflow.projectId}`
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
        folder: "ReportTasks",
      }
    );
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.delete("/:id", checkToken(), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const reportId = req.params.id;
    const user = req.user;
    if (!reportId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const report = await ReportTaskController.getReportTaskById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    const task = await TaskController.getTaskId(report.taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
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
        await RoleProjectPermissionController.checkIsPermissons(
          task.workflow.projectId,
          role.roleId,
          "deleteReport"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      if (role.roleId !== "SEO_Manager") {
        if (role.attendId !== report.createBy) {
          return res.status(402).json({
            success: false,
            message: "Bạn không có quyền",
          });
        }
      }
    }
    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "ReportTasks",
      path.basename(report.reportUrl)
    );
    const result = await ReportTaskController.deleteReportTask(reportId);
    const notification = await NotificationContronller.insertNotification(
      `Thông báo xóa báo cáo ${report.title}`,
      task.workflow.projectId,
      role.attendId,
      { transaction }
    );
    const attends = await AttendController.getUserRoleByProjectId(
      task.workflow.projectId
    );
    for (const item of attends) {
      if (item.attendId !== role.attendId && role.roleId !== "Guest") {
        await NotificationAttendController.insertNotificarionAttend(
          notification.notificationId,
          item.attendId,
          { transaction }
        );

        await sendMailNotification(
          item.email,
          `${report.title} của công việc ${task.title} của dự án ${task.workflow.project.name} của dự án mà bạn tham gia đã bị xóa bởi ${user.fullname}`,
          task.workflow.project.name,
          `${process.env.CLIENT_URL}?projectId=${task.workflow.projectId}`
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
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.put("/:id", checkToken(), uploadFile, async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    await safeUploader(
      req,
      res,
      next,
      async () => {
        const reportId = req.params.id;
        const newData = req.body;
        delete newData.reportId;
        const user = req.user;
        if (!reportId) throw new Error("Dữ liệu không hợp lệ");
        const report = await ReportTaskController.getReportTaskById(reportId);
        if (!report) throw new Error("Không tìm thấy báo cáo");
        const task = await TaskController.getTaskId(report.taskId);
        if (!task) throw new Error("Không tìm thấy dữ liệu");
        const role = await AttendController.getRoleIdByUserIdProjectId(
          user.userId,
          task.workflow.projectId
        );
        if (user.roleType !== "Admin System") {
          if (!role) throw new Error("Bạn không có quyền");
          const checkIsPermissons =
            await RoleProjectPermissionController.checkIsPermissons(
              task.workflow.projectId,
              role.roleId,
              "updateReport"
            );
          if (!checkIsPermissons) throw new Error("Bạn không có quyền");
          if (role.roleId !== "SEO_Manager") {
            if (user.userId !== report.createBy) {
              throw new Erro("Bạn không có quyền");
            }
            if (newData.taskId) {
              const checkExistingUser =
                await AssignTaskController.checkExistingUserInTask(
                  newData.taskId,
                  user.userId
                );
              if (role.roleId === "SEO_Specialist") {
                if (!checkExistingUser && task.createBy !== role.attendId)
                  throw new Error("Bạn không có quyền");
              }
              if (role.roleId === "Content_Writer") {
                if (!checkExistingUser) throw new Error("Bạn không có quyền");
              }
            }
          }
        }
        let filePath = report.reportUrl;
        let newFileUploaded = false;

        if (req.file) {
          newFileUploaded = true;
          filePath = `/uploads/ReportTasks/${req.file.filename}`;
        }

        newData.reportUrl = filePath;
        const updateRow = await ReportTaskController.updateReportTask(
          reportId,
          newData,
          { transaction }
        );
        if (!updateRow) throw new Error("Cập nhật thất bại");
        if (
          newFileUploaded &&
          report.reportUrl &&
          report.reportUrl !== filePath
        ) {
          const oldFilePath = path.join(
            __dirname,
            "..",
            "uploads",
            "ReportTasks",
            path.basename(report.reportUrl)
          );
          fs.unlink(oldFilePath, (err) => {
            if (err) console.error("Lỗi xoá file cũ:", err);
          });
        }
        const notification = await NotificationContronller.insertNotification(
          `Thông báo chỉnh sữa báo cáo ${report.title}`,
          task.workflow.projectId,
          role.attendId,
          { transaction }
        );

        const attends = await AttendController.getUserRoleByProjectId(
          task.workflow.projectId
        );
        for (const item of attends) {
          if (item.attendId !== role.attendId) {
            if (role.roleId === "Guest" && newData.visibility !== "public") {
              continue;
            }
            await NotificationAttendController.insertNotificarionAttend(
              notification.notificationId,
              item.attendId,
              { transaction }
            );

            await sendMailNotification(
              item.email,
              `${report.title} của công việc ${task.title} thuộc dự án ${task.workflow.project.name} đã được cập nhật lại bởi ${user.fullname}`,
              task.workflow.project.name,
              `${process.env.CLIENT_URL}?projectId=${task.workflow.projectId}`
            );
          }
        }
        await transaction.commit();
        return res.status(200).json({
          success: true,
          message: "Cập nhật thành công",
        });
      },
      {
        folder: "ReportTasks",
      }
    );
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    console.error("Lỗi:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
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
    const report = await ReportTaskController.getReportTaskAll();
    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get(
  "/getReportTaskPublicByTaskId/:id",
  checkToken(),
  async (req, res) => {
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
      const report = await ReportTaskController.getReportTaskPublicByTaskId(
        taskId
      );
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Không có dữ liệu",
        });
      }
      return res.status(200).json({
        success: true,
        report,
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

router.get("/getReportTaskByProjectId/:id", checkToken(), async (req, res) => {
  try {
    const projectId = req.params.id;
    const user = req.user;
    if (!projectId) {
      return res.status(401).json({
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
    let report = await ReportTaskController.getReportTaskByProjectId(projectId);
    if (user.roleType !== "Admin System") {
      const role = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        project.projectId
      );
      if (!role) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      if (role.roleId === "Guest") {
        report = await ReportTaskController.getReportTaskPublicByProjectId(
          projectId
        );
      }
    }

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Không có dữ liệu",
      });
    }
    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/getReportTaskByTaskId/:id", checkToken(), async (req, res) => {
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
        message: "Không tìm thấy dữ liệu",
      });
    }
    if (user.roleType !== "Admin System") {
      const role = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        task.workflow.project.projectId
      );
      if (!role) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const report = await ReportTaskController.getReportTaskByTaskId(taskId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Không có dữ liệu",
      });
    }
    return res.status(200).json({
      success: true,
      report,
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
