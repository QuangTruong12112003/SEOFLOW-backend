const express = require("express");
const ProjectController = require("../controller/ProjectController");
const AttendController = require("../controller/AttendController");

const router = express.Router();
const checkToken = require("../middleware/checkToken");
router.get("/searchProject", checkToken(), async (req, res) => {
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
    const result = await ProjectController.searchProject(keyword);
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

router.post("/", checkToken(), async (req, res) => {
  try {
    const projectData = req.body;
    if (
      !projectData.projectId ||
      !projectData.name ||
      !projectData.startDate ||
      !projectData.endDate
    ) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startDate = new Date(projectData.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(projectData.endDate);
    endDate.setHours(0, 0, 0, 0);
    if (startDate < now) {
      return res.status(402).json({
        success: false,
        message: "Ngày bắt đàu không hợp lệ",
      });
    }
    if (endDate < startDate) {
      return res.status(402).json({
        success: false,
        message: "Ngày kết thúc không hợp lệ",
      });
    }
    const user = req.user;
    projectData.createBy = user.userId;
    projectData.createAt = new Date();
    const projectNew = await ProjectController.insertProject(projectData);
    if (!projectNew) {
      return res.status(400).json({
        success: false,
        message: "Thêm không thành công",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Thêm thành công",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.put("/:id", checkToken(), async (req, res) => {
  try {
    const projectId = req.params.id;
    const projectData = req.body;
    delete projectData.projectId;
    const user = req.user;
    if (!projectId || !projectData) {
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
    if (user.userId !== project.createBy && user.roleType !== "Admin System") {
      return res.status(400).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const currentStartDate = new Date(project.startDate);
    currentStartDate.setHours(0, 0, 0, 0);

    let startDate = currentStartDate;
    if (projectData.startDate) {
      startDate = new Date(projectData.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (
        startDate.getTime() !== currentStartDate.getTime() &&
        startDate < now
      ) {
        return res.status(402).json({
          success: false,
          message: "Ngày bắt đầu chỉnh sửa không hợp lệ",
        });
      }
    }

    const currentEndDate = new Date(project.endDate);
    currentEndDate.setHours(0, 0, 0, 0);
    let endDate = currentEndDate;
    if (projectData.endDate) {
      endDate = new Date(projectData.endDate);
      endDate.setHours(0, 0, 0, 0);
      if (
        endDate.getTime() !== currentEndDate.getTime() &&
        (endDate < now || endDate <= startDate)
      ) {
        return res.status(402).json({
          success: false,
          message: "Ngày kết thúc chỉnh sửa không hợp lệ",
        });
      }
    }

    const updateRows = await ProjectController.updateProject(
      projectId,
      projectData
    );
    if (!updateRows) {
      return res.status(403).json({
        success: false,
        message: "Cập nhật không thành công",
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

router.delete("/:id", checkToken(), async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.userId;
    const role = req.user.roleType;
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
        message: "Không tìm thây dự án",
      });
    }
    if (userId !== project.createBy && role !== "Admin System") {
      return res.status(402).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const result = await ProjectController.deleteProject(projectId);
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi servers",
    });
  }
});

router.get("/", checkToken(), async (req, res) => {
  try {
    const role = req.user.roleType;
    if (role !== "Admin System") {
      return res.status(402).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const Listproject = await ProjectController.getAllProject();
    return res.status(200).json({
      success: true,
      projects: Listproject,
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
    return res.status(200).json({
      success: true,
      project,
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
