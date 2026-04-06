const express = require("express");
const checkToken = require("../middleware/checkToken");
const ToolController = require("../controller/ToolController");
const ToolFieldController = require("../controller/ToolFieldController");
const AttendController = require("../controller/AttendController");
const router = express.Router();

router.post("/", checkToken(), async (req, res) => {
  try {
    const formData = req.body;
    const user = req.user;
    if (
      !formData.name ||
      !formData.idfield ||
      !formData.hint ||
      !formData.toolId ||
      !formData.fieldId
    ) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const tool = await ToolController.getByPK(formData.toolId);
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
    const toolField = await ToolFieldController.insert(formData);
    if (!toolField) {
      return res.status(400).json({
        success: false,
        message: "Thêm thất bại",
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

module.exports = router;
