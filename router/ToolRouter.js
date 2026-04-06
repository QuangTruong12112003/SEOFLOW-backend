const express = require("express");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const checkToken = require("../middleware/checkToken");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const AttendController = require("../controller/AttendController");
const ToolController = require("../controller/ToolController");
const { where } = require("sequelize");
const AttendToolController = require("../controller/AttendToolController");
const router = express.Router();
const models = initModels(sequelize);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", checkToken(), async (req, res) => {
  try {
    const formData = req.body;
    const user = req.user;
    if (!formData.label || !formData.prompt || !formData.projectId) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const attend = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      formData.projectId
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
    const tool = await ToolController.insert(formData);
    if (!tool) {
      return res.status(400).json({
        success: false,
        message: "Thêm thất bại",
      });
    }
    const attendSEOManager = await AttendController.getUserByProjectIdRoleId(
      formData.projectId,
      "SEO_Manager"
    );
    for (const item of attendSEOManager) {
      await AttendToolController.insert(item.attendId, tool.id);
    }
    return res.status(200).json({
      success: true,
      message: "Thêm thành công",
      tool,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi serevr",
    });
  }
});

router.post("/insertRoleUseTool/:id", checkToken(), async (req, res) => {
  try {
    const toolId = req.params.id;
    const { roles } = req.body;
    if (!roles) {
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
    for (const itemR of roles) {
      const attends = await AttendController.getUserByProjectIdRoleId(
        tool.projectId,
        itemR.roleId
      );
      for (const item of attends) {
        await AttendToolController.insert(item.attendId, tool.id);
      }
    }
    return res.status(200).json({
      success: true,
      message: "Thêm thành công"
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/getToolByProjectId/:id", checkToken(), async (req, res) => {
  try {
    const projectId = req.params.id;
    const user = req.user;
    const attend = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      projectId
    );
    if (!attend) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    //const tools = await ToolController.getToolByProject(projectId);
    const tools = await AttendToolController.getToolUseByUser(
      user.userId,
      projectId
    );
    return res.status(200).json({
      success: true,
      tools,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi serevr",
    });
  }
});

router.post("/genarate", checkToken(), async (req, res) => {
  try {
    const { prompt } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonText = text.match(/```json\n([\s\S]*?)\n```/)[1];
    const data = JSON.parse(jsonText);
    return res.status(200).json({
      success: true,
      data,
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
    const id = req.params.id;
    const user = req.user;
    const tool = await ToolController.getByPK(id);
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

    if (!attend || attend.roleId !== "SEO_Manager") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }

    const deleteRow = await ToolController.delete(tool.id);
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
    const id = req.params.id;
    const user = req.user;
    const tool = await ToolController.getByPK(id);
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
    return res.status(200).json({
      success: true,
      tool,
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
  const transaction = await sequelize.transaction();
  try {
    const toolId = req.params.id;
    const { label, prompt, toolfiels } = req.body;
    const user = req.user;
    if (!label || !prompt || !toolfiels) {
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
    const attend = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      tool.projectId
    );
    if (!attend || attend.roleId !== "SEO_Manager") {
      return res.status(404).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    await models.toolfield.destroy({
      where: { toolId: tool.id },
      transaction,
    });
    for (const item of toolfiels) {
      item.toolId = tool.id;
      await models.toolfield.create(item, { transaction });
    }
    await models.tool.update(
      { label: label, prompt: prompt },
      { where: { id: tool.id }, transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
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

module.exports = router;
