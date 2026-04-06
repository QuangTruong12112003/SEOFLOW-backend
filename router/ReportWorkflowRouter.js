const express = require("express");
const sequelize = require("../config/database");
const checkToken = require("../middleware/checkToken");
const {
  createUploader,
  handleUploadError,
  safeUploader,
} = require("../middleware/uploadHelper");
const WorkflowController = require("../controller/WofkflowController");
const AttendController = require("../controller/AttendController");
const RoleProjectPermissiomController = require("../controller/RoleProjectPermissionController");
const ReportWorkflowController = require("../controller/ReportWorkflowController");
const ProjectController = require("../controller/ProjectController");
const path = require("path");
const fs = require("fs");
const NotificationContronller = require("../controller/NotificationController");
const NotificationAttendController = require("../controller/NotificationAttendController");
const { sendMailNotification } = require("../middleware/sendOtp");

const router = express.Router();

const uploader = createUploader({
  folder: "ReportWorkflows",
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
        if (!newData.reportId || !newData.title || !newData.workflowId)
          throw new Error("Dữ liệu không hợp lệ");
        const workflow = await WorkflowController.getWorkflowId(
          newData.workflowId
        );
        if (!workflow) throw new Error("Không tìm thấy giai đoạn");
        const role = await AttendController.getRoleIdByUserIdProjectId(
          user.userId,
          workflow.projectId
        );
        if (user.roleType !== "Admin System") {
          if (!role) throw new Error("Bạn không có quyền");
          const checkIsPermissons =
            await RoleProjectPermissiomController.checkIsPermissons(
              workflow.projectId,
              role.roleId,
              "insertReport"
            );
          if (!checkIsPermissons) throw new Error("Bạn không có quyền");
        }
        if (!req.file) throw new Error("Không có file dữ liệu");
        const file = `/uploads/ReportWorkflows/${req.file.filename}`;
        newData.reportUrl = file;
        newData.date = new Date();
        newData.createBy = role.attendId;
        const newRow = await ReportWorkflowController.insertReportWorkflow(
          newData,
          transaction
        );
        if (!newRow) throw new Error("Thêm thất bại");
        const notification = await NotificationContronller.insertNotification(
          "Thông báo thêm giai đoạn",
          workflow.projectId,
          role.attendId,
          { transaction }
        );
        const attends = await AttendController.getUserRoleByProjectId(
          workflow.projectId
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
              `Một báo cáo giai đoạn ${workflow.name} đã được thêm vào dự án ${workflow.project.name} mà bạn tham gia`,
              workflow.project.name,
              `${process.env.CLIENT_URL}?projectId=${workflow.projectId}`
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
        folder: "ReportWorkflows",
      }
    );
  } catch (error) {
    await transaction.rollback();
    const folder = ReportWorkflows;
    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      folder,
      req.file.filename
    );
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log("Lỗi khi xoá file sau khi upload thất bại:", err);
      } else {
        console.log("Đã xoá file vì thất bại:", err);
      }
    });
    console.log(error);
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
    const report = await ReportWorkflowController.getReportWorkflowId(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy báo cáo",
      });
    }
    const workflow = await WorkflowController.getWorkflowId(report.workflowId);
    const role = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      workflow.projectId
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
          workflow.projectId,
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
    const filePath = report.reportUrl
      ? path.join(
          __dirname,
          "..",
          "uploads",
          "ReportWorkflows",
          path.basename(report.reportUrl)
        )
      : null;
    const result = await ReportWorkflowController.deleteReportWorkflow(
      reportId,
      { transaction }
    );
    const notification = await NotificationContronller.insertNotification(
      "Thông báo xóa giai đoạn",
      workflow.projectId,
      role.attendId,
      { transaction }
    );
    const seomanager = await AttendController.getUserByProjectIdRoleId(
      workflow.projectId,
      "SEO_Manager"
    );
    for (const item of seomanager) {
      if (item.attendId !== role.attendId) {
        await NotificationAttendController.insertNotificarionAttend(
          notification.notificationId,
          item.attendId,
          { transaction }
        );

        await sendMailNotification(
          item.email,
          `Báo cáo ${report.title} của giai đoạn ${workflow.name} thuộc dự án ${workflow.project.name} mà bạn quản lý đã bị xóa bởi ${user.fullname}`,
          workflow.project.name,
          `${process.env.CLIENT_URL}?projectId=${workflow.projectId}`
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

router.put("/:id", checkToken(), uploadFile, async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    await safeUploader(
      req,
      res,
      next,
      async () => {
        const reportId = req.params.id;
        const user = req.user;
        const newData = req.body;
        delete newData.reportId;
        if (!reportId) throw new Error("Dữ liệu không hợp lệ");
        const oldReport = await ReportWorkflowController.getReportWorkflowId(
          reportId
        );
        if (!oldReport) throw new Error("Không tìm thấy báo cáo");
        const workflow = await WorkflowController.getWorkflowId(
          oldReport.workflowId
        );
        const role = await AttendController.getRoleIdByUserIdProjectId(
          user.userId,
          workflow.projectId
        );
        if (user.roleType !== "Admin System") {
          if (!role) throw new Error("Bạn không có quyền");
          const checkIsPermissons =
            await RoleProjectPermissiomController.checkIsPermissons(
              workflow.projectId,
              role.roleId,
              "updateReport"
            );
          if (!checkIsPermissons) throw new Error("Bạn không có quyền");
          if (role.roleId !== "SEO_Manager") {
            if (role.attendId !== role.userId)
              throw new Error("Bạn không có quyền");
          }
        }
        let filePath = oldReport.reportUrl;
        let newFileUploaded = false;

        if (req.file) {
          newFileUploaded = true;
          filePath = `/uploads/ReportWorkflows/${req.file.filename}`;
        }

        newData.reportUrl = filePath;
        const updateRow = await ReportWorkflowController.updateReportWorkflow(
          reportId,
          newData,
          { transaction }
        );
        if (!updateRow) throw new Error("Cập nhật thất bại");

        if (
          newFileUploaded &&
          oldReport.reportUrl &&
          oldReport.reportUrl !== filePath
        ) {
          const oldFilePath = path.join(
            __dirname,
            "..",
            "uploads",
            "ReportWorkflows",
            path.basename(oldReport.reportUrl)
          );
          fs.unlink(oldFilePath, (err) => {
            if (err) console.error("Lỗi xoá file cũ:", err);
          });
        }
        const notification = await NotificationContronller.insertNotification(
          `Cập nhật báo cáo ${oldReport.title} cho giai đoạn`,
          workflow.projectId,
          role.attendId,
          { transaction }
        );
        const attends = await AttendController.getUserRoleByProjectId(
          workflow.projectId
        );
        for (const item of attends) {
          if (item.attendId !== role.attendId) {
            if (item.role === "Guest" && newData.visibility !== "public") {
              continue;
            }
            await NotificationAttendController.insertNotificarionAttend(
              notification.notificationId,
              item.attendId,
              { transaction }
            );
            await sendMailNotification(
              item.email,
              `Báo cáo ${oldReport.title} của gia đoạn ${workflow.name} thuộc dự án ${workflow.project.name} đã được cập nhật bởi ${user.fullname}`,
              workflow.project.name,
              `${process.env.CLIENT_URL}?projectId=${workflow.projectId}`
            );
          }
        }
        await transaction.commit();
        return res.status(200).json({
          success: true,
          message: "Cập nhật thành công",
        });
      },
      { folder: "ReportWorkflows" }
    );
  } catch (error) {
    await transaction.rollback();
    console.error("Lỗi:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

router.get(
  "/getReportWorkflowPublicByWorkflowId/:id",
  checkToken(),
  async (req, res) => {
    try {
      const workflowId = req.params.id;
      const user = req.user;
      if (!workflowId) {
        return res.status(401).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
        });
      }
      const workflow = await WorkflowController.getWorkflowId(workflowId);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dữ liệu",
        });
      }
      if (user.roleType !== "Admin System") {
        const role = await AttendController.getRoleIdByUserIdProjectId(
          user.userId,
          workflow.projectId
        );
        if (!role) {
          return res.status(402).json({
            success: false,
            message: "Bạn không có quyền",
          });
        }
      }
      const report = await ReportWorkflowController.getReportWorkflowPublic(
        workflow.workflowId
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

router.get("/", checkToken(), async (req, res) => {
  try {
    const user = req.user;
    if (user.roleType !== "Admin System") {
      return res.status(402).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const report = await ReportWorkflowController.getReportWorkflow();
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "không tìm thấy dữ liệu",
      });
    }
    return res.status(200).json({
      success: false,
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
  "/getReportWorkflowByProject/:id",
  checkToken(),
  async (req, res) => {
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
          message: "Không tìm thấy dự án",
        });
      }
      let report = await ReportWorkflowController.getReportWorkflowByProjectId(
        projectId
      );
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
          report =
            await ReportWorkflowController.getReportWorkflowPublicByProjectId(
              projectId
            );
        }
      }

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dữ liệu",
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

module.exports = router;
