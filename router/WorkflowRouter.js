const express = require("express");
const WorkflowController = require("../controller/WofkflowController");
const ProjectController = require("../controller/ProjectController");
const router = express.Router();
const checkToken = require("../middleware/checkToken");
const AttendController = require("../controller/AttendController");
const RoleProjectPermissiomController = require("../controller/RoleProjectPermissionController");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const handleID = require("../middleware/handleID");
const TaskController = require("../controller/TaskController");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.get("/searchWorkflowByProject", checkToken(), async (req, res) => {
  try {
    const { projectId, keyword } = req.query;
    const user = req.user;
    if (!projectId || !keyword) {
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
    const result = await WorkflowController.searchWorkflowByProject(
      projectId,
      keyword
    );
    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});
router.get("/searchWorkflow", checkToken(), async (req, res) => {
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
    const result = await WorkflowController.searchWorkflow(keyword);
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

router.get("/getWorkflowbyProject", checkToken(), async (req, res) => {
  try {
    const { projectId, limit, page } = req.query;
    const user = req.user;
    if (!projectId) {
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
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const workflow = await WorkflowController.getWorkflowbyProject(
      projectId,
      limit,
      offset
    );
    return res.status(200).json({
      success: true,
      workflow,
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
    const workflowData = req.body;
    const user = req.user;
    if (
      !workflowData.workflowId ||
      !workflowData.name ||
      !workflowData.startDate ||
      !workflowData.endDate | !workflowData.projectId
    ) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const project = await ProjectController.getProjectById(
      workflowData.projectId
    );
    if (!project) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
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
          message: "Bạn không nằm trong dự án hoặc dự án không hợp lệ",
        });
      }
      const checkIsPermissons =
        await RoleProjectPermissiomController.checkIsPermissons(
          project.projectId,
          role.roleId,
          "insertWorkflow"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const projectStartDate = new Date(project.startDate);
    projectStartDate.setHours(0, 0, 0, 0);
    const projectEndDate = new Date(project.endDate);
    projectEndDate.setHours(0, 0, 0, 0);
    const workflowStartDate = new Date(workflowData.startDate);
    workflowStartDate.setHours(0, 0, 0, 0);
    const workflowEndDate = new Date(workflowData.endDate);
    workflowEndDate.setHours(0, 0, 0, 0);
    if (
      workflowStartDate < projectStartDate ||
      workflowStartDate > projectEndDate ||
      now > workflowStartDate
    ) {
      return res.status(401).json({
        success: false,
        message: "Ngày băt đầu không hợp lệ",
      });
    }
    if (
      workflowEndDate < projectStartDate ||
      workflowEndDate > projectEndDate ||
      workflowStartDate >= workflowEndDate
    ) {
      return res.status(403).json({
        success: false,
        message: "Ngày kết thúc không hợp lệ",
      });
    }
    workflowData.createAt = new Date();
    const newRow = await WorkflowController.insert(workflowData);
    if (!newRow) {
      return res.status(403).json({
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
router.delete("/:id", checkToken(), async (req, res) => {
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
        message: "Không tìm thấy giai đoạn",
      });
    }
    if (user.roleType !== "Admin System") {
      const role = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        workflow.projectId
      );
      if (!role) {
        return res.status(403).json({
          success: false,
          message: "Bạn không nằm trong dự án hoặc dự án không hợp lệ",
        });
      }
      const checkIsPermissons =
        await RoleProjectPermissiomController.checkIsPermissons(
          workflow.projectId,
          role.roleId,
          "deleteWorkflow"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const result = await WorkflowController.delete(workflowId);
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
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
    const workflowId = req.params.id;
    const user = req.user;
    const newData = req.body;
    if (!workflowId || !newData) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const workflow = await WorkflowController.getWorkflowId(workflowId);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giai đoạn",
      });
    }
    if (user.roleType !== "Admin System") {
      const role = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        workflow.projectId
      );
      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Bạn không nằm trong dự án hoặc dự án không hợp lệ",
        });
      }
      const checkIsPermissons =
        await RoleProjectPermissiomController.checkIsPermissons(
          workflow.projectId,
          role.roleId,
          "updateWorkflow"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const project = await ProjectController.getProjectById(workflow.projectId);
    const projectStartDate = new Date(project.startDate);
    projectStartDate.setHours(0, 0, 0, 0);
    const projectEndDate = new Date(project.endDate);
    projectEndDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentStartDate = new Date(workflow.startDate);
    currentStartDate.setHours(0, 0, 0, 0);
    let startDate = currentStartDate;
    if (newData.startDate) {
      startDate = new Date(newData.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (
        startDate.getTime() !== currentStartDate.getTime() &&
        (startDate < projectStartDate ||
          startDate > projectEndDate ||
          startDate < now)
      ) {
        return res.status(401).json({
          success: false,
          message: "Ngày bắt đầu không hợp lệ",
        });
      }
    }

    const currentEndDate = new Date(workflow.endDate);
    currentEndDate.setHours(0, 0, 0, 0);
    let endDate = currentEndDate;
    if (newData.endDate) {
      endDate = new Date(newData.endDate);
      endDate.setHours(0, 0, 0, 0);
      if (
        endDate.getTime() !== currentEndDate.getTime() &&
        (endDate < projectStartDate ||
          endDate > projectEndDate ||
          endDate < startDate)
      ) {
        return res.status(403).json({
          success: false,
          message: "Ngày kết thúc không hợp lệ",
        });
      }
    }

    const updateRow = await WorkflowController.updateWorkflow(
      workflowId,
      newData
    );
    if (!updateRow) {
      return res.status(400).json({
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
router.get("/", checkToken(), async (req, res) => {
  try {
    const user = req.user;
    if (user.roleType !== "Admin System") {
      return res.status(402).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const workflows = await WorkflowController.getALlWorkflow();
    return res.status(200).json({
      success: true,
      workflows,
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
    const user = req.user;
    const workflowId = req.params.id;
    if (!workflowId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const workflow = await WorkflowController.getWorkflowId(workflowId);
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
    return res.status(200).json({
      success: true,
      workflow,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.post("/genarateWorkflow/:id", checkToken(), async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await ProjectController.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thất dữ liệu",
      });
    }

    const prompt = `Bạn là một chuyên gia SEO nhiều kinh nghiệm. 
Nhiệm vụ của bạn là lập kế hoạch SEO chi tiết cho một dự án, dựa vào mục tiêu, ngày bắt đầu và ngày kết thúc của dự án. 
Quy tắc quan trọng:
1. Chỉ trả lời bằng JSON hợp lệ.
2. Không giải thích, không viết thêm chữ ngoài JSON.
3. JSON phải tuân theo cấu trúc sau:

[
  {
    "name": "Tên giai đoạn SEO",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "tasks": [
      {
        "title": "Tên task con",
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD",
        "description": "Mô tả ngắn gọn về task này"
      }
    ]
  }
]

Yêu cầu:

- Chia dự án thành nhiều giai đoạn hợp lý từ {startDate} đến {endDate}.
- Mỗi giai đoạn có khoảng 5 task con.
- Các ngày phải nằm trong phạm vi thời gian dự án.
- Nội dung phù hợp với mục tiêu SEO được cung cấp.

- Mục tiêu: ${project.goal}
- Ngày bắt đầu: ${project.startDate}
- Ngày kết thúc: ${project.endDate}

Chỉ trả về JSON hợp lệ như đã mô tả ở trên.
`;
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response;
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

router.post("/addWorkflowGenerateAI/:id", checkToken(), async (req, res) => {
  try {
    const projectId = req.params.id;
    const data = req.body;
    const workflowData = {
      workflowId: handleID("WF"),
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      projectId: projectId,
    };
    const tasks = data.tasks;
    const user = req.user;
    if (
      !workflowData.name ||
      !workflowData.startDate ||
      !workflowData.endDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const project = await ProjectController.getProjectById(projectId);
    if (!project) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const role = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      project.projectId
    );
    if (user.roleType !== "Admin System") {
      if (!role) {
        return res.status(402).json({
          success: false,
          message: "Bạn không nằm trong dự án hoặc dự án không hợp lệ",
        });
      }
      const checkIsPermissons =
        await RoleProjectPermissiomController.checkIsPermissons(
          project.projectId,
          role.roleId,
          "insertWorkflow"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    workflowData.createAt = new Date();
    const newRow = await WorkflowController.insert(workflowData);
    if (!newRow) {
      return res.status(403).json({
        success: false,
        message: "Thêm không thành công",
      });
    }
    for (const item of tasks) {
      item.taskId = handleID("TSK");
      item.workflowId = workflowData.workflowId;
      item.createBy = role.attendId;
      await TaskController.insert(item);
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
