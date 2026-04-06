const express = require("express");
const checkToken = require("../middleware/checkToken");
const ToolController = require("../controller/ToolController");
const AttendController = require("../controller/AttendController");
const AttendToolController = require("../controller/AttendToolController");
const router = express.Router();

router.get("/checkBox", checkToken(), async (req, res) => {
  try {
    const { toolId, roleId } = req.query;
    if (!toolId || !roleId) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const tool = await ToolController.getByPK(toolId);
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    const attends = await AttendController.getUserByProjectIdRoleId(
      tool.projectId,
      roleId
    );
    if (!attends) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const attendTools = await AttendToolController.getToolByRoleIdAndToolId(
      tool.id,
      roleId
    );
    if (attends.length === attendTools.length) {
      return res.status(200).json({
        success: true,
        message: "Tất cả thành viên của vai trò đã được thêm",
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "Có thành viên chưa được thêm",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/getAttendNotUseTool", checkToken(), async (req, res) => {
  try {
    const { projectId, toolId } = req.query;
    if (!projectId || !toolId) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const attends = await AttendToolController.getAttendNotUseToolId(
      toolId,
      projectId
    );
    if (!attends) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    return res.status(200).json({
      success: true,
      attends,
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
    const { toolId, roleId } = req.body;
    const user = req.user;
    if (!toolId || !roleId) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const tool = await ToolController.getByPK(toolId);
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: "Không thể tìm thấy dữ liệu",
      });
    }
    const attend = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      tool.projectId
    );
    if (!attend) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    if (attend.roleId !== "SEO_Manager") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const attendRole = await AttendController.getUserByProjectIdRoleId(
      tool.projectId,
      roleId
    );
    if (!attendRole) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    for (const item of attendRole) {
      await AttendToolController.insert(item.attendId, tool.id);
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

router.post("/insertMember", checkToken(), async (req, res) => {
  try {
    const { toolId, attendId } = req.body;
    const user = req.user;
    if (!toolId || !attendId) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const tool = await ToolController.getByPK(toolId);
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: "Không thể tìm thấy dữ liệu",
      });
    }
    const attend = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      tool.projectId
    );
    if (!attend) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    if (attend.roleId !== "SEO_Manager") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    await AttendToolController.insert(attendId, tool.id);
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

router.delete("", checkToken(), async (req, res) => {
  try {
    const { toolId, roleId } = req.query;
    if (!toolId || !roleId) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const user = req.user;
    const tool = await ToolController.getByPK(toolId);
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const attend = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      tool.projectId
    );
    if (!attend) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    if (attend.roleId !== "SEO_Manager") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const attendItem = await AttendController.getUserByProjectIdRoleId(
      tool.projectId,
      roleId
    );
    if (!attendItem) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    for (const item of attendItem) {
      await AttendToolController.delete(item.attendId, tool.id);
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

router.delete("/deleteMember", checkToken(), async (req, res) => {
  try {
    const { toolId, attendId } = req.query;
    if (!toolId || !attendId) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const user = req.user;
    const tool = await ToolController.getByPK(toolId);
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const attend = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      tool.projectId
    );
    if (!attend) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    if (attend.roleId !== "SEO_Manager") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const deleteRow = await AttendToolController.delete(attendId, tool.id);
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

router.get("/:id", checkToken(), async (req, res) => {
  try {
    const toolId = req.params.id;
    const user = req.user;
    const tool = await ToolController.getByPK(toolId);
    const { page = 1 } = req.query;
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    const attend = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      tool.projectId
    );
    if (!attend) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    if (attend.roleId !== "SEO_Manager") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const offset = (parseInt(page) - 1) * 5;
    const { total, data } = await AttendToolController.getToolByid(
      tool.id,
      offset
    );
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    return res.status(200).json({
      success: true,
      users: data,
      total,
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
