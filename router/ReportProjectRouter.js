const express = require("express");
const sequelize = require("../config/database");
const {
  createUploader,
  handleUploadError,
  safeUploader,
} = require("../middleware/uploadHelper");
const checkToken = require("../middleware/checkToken");
const ProjectController = require("../controller/ProjectController");
const AttendController = require("../controller/AttendController");
const RoleProjectPermissiomController = require("../controller/RoleProjectPermissionController");
const ReportProjectController = require("../controller/ReportProjectController");
const path = require("path");
const fs = require("fs");
const NotificationContronller = require("../controller/NotificationController");
const NotificationAttendController = require("../controller/NotificationAttendController");
const { sendMailNotification } = require("../middleware/sendOtp");

const router = express.Router();
const uploader = createUploader({
  folder: "ReportProjects",
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
        if (!newData.reportId || !newData.title || !newData.projectId)
          throw new Error("Dữ liệu không hợp lệ");
        const project = await ProjectController.getProjectById(
          newData.projectId
        );
        if (!project) throw new Error("Không tìm thấy dự án");
        const role = await AttendController.getRoleIdByUserIdProjectId(
          user.userId,
          newData.projectId
        );
        if (user.roleType !== "Admin System") {
          if (!role) throw new Error("Bạn không có quyền");
          const checkIsPermissons =
            await RoleProjectPermissiomController.checkIsPermissons(
              newData.projectId,
              role.roleId,
              "insertReport"
            );
          if (!checkIsPermissons) throw new Error("Bạn không có quyền");
        }
        if (!req.file) throw new Error("Không có file dữ liệu");
        const file = `/uploads/ReportProjects/${req.file.filename}`;
        newData.reportUrl = file;
        const attend = await AttendController.getRoleIdByUserIdProjectId(
          user.userId,
          newData.projectId
        );
        newData.date = new Date();
        newData.createBy = attend.attendId;
        const newRow = await ReportProjectController.insertReportProject(
          newData,
          { transaction }
        );
        if (!newRow) throw new Error("Thêm thất bại");
        const notification = await NotificationContronller.insertNotification(
          `Thêm báo cáo cho dự án ${project.name}`,
          project.projectId,
          role.attendId,
          { transaction }
        );
        if (!notification) throw new Error("Lỗi thêm báo");
        const Member = await AttendController.getUserRoleByProjectId(
          newData.projectId
        );
        if (!Member) throw new Error("Lỗi lấy thành viên");
        for (const item of Member) {
          if (item.attendId !== role.attendId) {
            if (role.roleId !== "Guest") {
              await NotificationAttendController.insertNotificarionAttend(
                notification.notificationId,
                item.attendId,
                { transaction }
              );

              await sendMailNotification(
                item.email,
                `${user.fullname} đã thêm báo cáo cho dự án ${project.name} mà bạn đã tham gia`,
                project.name,
                `${process.env.CLIENT_URL}?projectId=${project.projectId}`
              );
            }
          }
        }
        await transaction.commit();
        return res.status(200).json({
          success: true,
          message: "Thêm thành công",
        });
      },
      {
        folder: "ReportProjects",
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
router.get("/searchReport", checkToken(), async (req, res) => {
  try {
    const { projectId, keyword } = req.query;
    const user = req.user;
    if (!projectId || !keyword) {
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
    const result = await ReportProjectController.searchReportProject(
      projectId,
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
router.get("/searchReportAdmin", checkToken(), async (req, res) => {
  try {
    const { keyword } = req.query;
    const user = req.user;
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    if (user.roleType !== "Admin System") {
      return res.status(401).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const result = await ReportProjectController.searchReport(keyword);
    if (!result) {
      return res.status(400).json({
        success: false,
        message: "Tìm thất bại",
      });
    }
    return res.status(200).json({
      success: false,
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
    const report = await ReportProjectController.getReportById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    const role = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      report.projectId
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
          report.projectId,
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
          "ReportProjects",
          path.basename(report.reportUrl)
        )
      : null;
    const result = await ReportProjectController.deleteReportProject(reportId, {
      transaction,
    });
    const notification = await NotificationContronller.insertNotification(
      `Xóa báo cáo của dự án ${report.projectId}`,
      report.projectId,
      role.attendId,
      { transaction }
    );
    const SEOManager = await AttendController.getUserByProjectIdRoleId(
      report.projectId,
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
          `Báo cáo ${report.title} đã bị xóa bởi ${user.fullname}`,
          report.project?.name,
          `${process.env.CLIENT_URL}?projectId=${report.projectId}`
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

        const oldReport = await ReportProjectController.getReportById(reportId);
        if (!oldReport) throw new Error("Không tìm thấy báo cao");
        const role = await AttendController.getRoleIdByUserIdProjectId(
          user.userId,
          oldReport.projectId
        );
        if (user.roleType !== "Admin System") {
          if (!role) throw new Error("Bạn không có quyền");
          const checkIsPermissons =
            await RoleProjectPermissiomController.checkIsPermissons(
              oldReport.projectId,
              role.roleId,
              "updateReport"
            );
          if (!checkIsPermissons) throw new Error("Bạn không có quyền");
          if (role.roleId !== "SEO_Manager") {
            if (user.userId !== oldReport.createBy)
              throw new Error("Bạn không có quyền");
          }
        }
        let filePath = oldReport.reportUrl;
        let newFileUploaded = false;

        if (req.file) {
          newFileUploaded = true;
          filePath = `/uploads/ReportProjects/${req.file.filename}`;
        }

        newData.reportUrl = filePath;
        const updated = await ReportProjectController.updateReportProject(
          reportId,
          newData,
          { transaction }
        );
        if (!updated) throw new Error("Cập nhật thất bại");

        const notification = await NotificationContronller.insertNotification(
          `Cập báo cáo dự án ${oldReport.project.name}`,
          oldReport.projectId,
          role.attendId,
          { transaction }
        );

        if (!notification) throw new Error("Lỗi thêm thông báo");
        const Attends = await AttendController.getUserRoleByProjectId(
          oldReport.projectId
        );
        for (const item of Attends) {
          if (newData.visibility !== "public" && item.roleId === "Guest") {
            continue;
          }
          if (item.attendId !== role.attendId) {
            await NotificationAttendController.insertNotificarionAttend(
              notification.notificationId,
              item.attendId,
              { transaction }
            );

            await sendMailNotification(
              item.email,
              `Báo cáo ${oldReport.title} đã được cập nhật`,
              oldReport.project.name,
              `${process.env.CLIENT_URL}?projectId=${oldReport.projectId}`
            );
          }
        }
        if (
          newFileUploaded &&
          oldReport.reportUrl &&
          oldReport.reportUrl !== filePath
        ) {
          const oldFilePath = path.join(
            __dirname,
            "..",
            "uploads",
            "ReportProjects",
            path.basename(oldReport.reportUrl)
          );
          fs.unlink(oldFilePath, (err) => {
            if (err) console.error("Lỗi xoá file cũ:", err);
          });
        }
        await transaction.commit();
        return res.status(200).json({
          success: true,
          message: "Cập nhật thành công",
        });
      },
      {
        folder: "ReportProjects",
      }
    );
  } catch (error) {
    await transaction.rollback();
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    console.error("Lỗi:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

router.get("/getReportProjectPublic/:id", checkToken(), async (req, res) => {
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
    if (user.roleType !== "Admin") {
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
    }
    const report = await ReportProjectController.getReportProjectPublic(
      projectId
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
});

router.get("/getReportProjectByUser", checkToken(), async (req, res) => {
  try {
    const { userId, projectId } = req.query;
    const user = req.user;
    if (!userId || !projectId) {
      res.status(401).json({
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
    }
    const report = await ReportProjectController.getReportProjectByUser(
      userId,
      project.projectId
    );
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
});

router.get(
  "/getAllReportProjectByProject/:id",
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
      let report = await ReportProjectController.getRpeortProjectByProjectId(
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
          report = await ReportProjectController.getReportProjectPublic(
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

router.get("/", checkToken(), async (req, res) => {
  try {
    const user = req.user;
    if (user.roleType !== "Admin System") {
      return res.status(402).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const report = await ReportProjectController.getReportPrject();
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
});

router.get("/:id", checkToken(), async (req, res) => {
  try {
    const reportId = req.params.id;
    const user = req.user;
    if (!reportId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }

    // if (user.roleType !== "Admin System") {
    //   return res.status(402).json({
    //     success: false,
    //     message: "Bạn không có quyền",
    //   });
    // }

    const report = await ReportProjectController.getReportId(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thất dữ liệu",
      });
    }
    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
});

router.post("/checkOwner/", checkToken(), async (req, res) => {
  try {
    const { projectId, reportId } = req.body;
    if (!projectId || !reportId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const user = req.user;
    const project = await ProjectController.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    const report = await ReportProjectController.getReportId(reportId);
    if (!report) {
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
      if (role.roleId !== "SEO_Manager") {
        if (role.attendId !== report.createBy) {
          return res.status(200).json({
            success: false,
            message: "Bạn không có quyền",
          });
        }
      }
    }
    return res.status(200).json({
      success: true,
      message: "Bạn có quyền",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/getAllReportProject/:id", checkToken(), async (req, res) => {
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
    }
    const report = await ReportProjectController.getAllReportProjet(projectId);
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
});

router.get("/getAllReportProjectPublic/:id", checkToken(), async (req, res) => {
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
    }
    const report = await ReportProjectController.getAllReportProjetPublicForGuest(projectId);
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
});

module.exports = router;
