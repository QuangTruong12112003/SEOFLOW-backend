const express = require("express");
const TaskController = require("../controller/TaskController");
const WorkflowController = require("../controller/WofkflowController");
const AttendController = require("../controller/AttendController");
const RoleProjectPermissiomController = require("../controller/RoleProjectPermissionController");
const checkToken = require("../middleware/checkToken");
const ProjectController = require("../controller/ProjectController");
const AssignTaskController = require("../controller/AssignTaskController");
const NotificationAttendController = require("../controller/NotificationAttendController");
const { sendMailNotification } = require("../middleware/sendOtp");
const NotificationContronller = require("../controller/NotificationController");
const sequelize = require("../config/database");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const router = express.Router();
require("dotenv").config();

router.get("/searchTaskByProject", checkToken(), async (req, res) => {
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
        message: "Không tim thấy dữ liệu",
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
    const result = await TaskController.searchTaskByProject(projectId, keyword);
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

router.get("/searchTask", checkToken(), async (req, res) => {
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
    const result = await TaskController.searchTask(keyword);
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

router.get(
  "/getTaskByProjecNotAssignedUser",
  checkToken(),
  async (req, res) => {
    try {
      const { projectId, attendId } = req.query;
      const user = req.user;
      if (!projectId || !attendId) {
        return res.status(400).json({
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
      const task = await TaskController.getTaskByProjecNotAssignedUser(
        projectId,
        attendId
      );
      if (!task) {
        return res.status(401).json({
          success: false,
          message: "Không thể tải dữ liệu",
        });
      }
      return res.status(200).json({
        success: false,
        task,
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

router.post("/", checkToken(), async (req, res) => {
  try {
    const taskData = req.body;
    const user = req.user;
    if (
      !taskData.taskId ||
      !taskData.title ||
      !taskData.startDate ||
      !taskData.endDate ||
      !taskData.workflowId
    ) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const workflow = await WorkflowController.getWorkflowId(
      taskData.workflowId
    );
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
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      if (role.roleId === "SEO_Specialist") {
        taskData.status = "Chờ xét duyệt";
      }
      const checkIsPermissons =
        await RoleProjectPermissiomController.checkIsPermissons(
          workflow.projectId,
          role.roleId,
          "insertTask"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const attend = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      workflow.projectId
    );
    taskData.createBy = attend.attendId;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const workflowStartDate = new Date(workflow.startDate);
    workflowStartDate.setHours(0, 0, 0, 0);
    const workflowEndDate = new Date(workflow.endDate);
    workflowEndDate.setHours(0, 0, 0, 0);
    const taskStartDate = new Date(taskData.startDate);
    taskStartDate.setHours(0, 0, 0, 0);
    const taskEndDate = new Date(taskData.endDate);
    taskEndDate.setHours(0, 0, 0, 0);
    if (
      taskStartDate < workflowStartDate ||
      taskStartDate > workflowEndDate ||
      now > taskStartDate
    ) {
      return res.status(401).json({
        success: false,
        message: "Ngày băt đầu không hợp lệ",
      });
    }
    if (
      taskEndDate < workflowStartDate ||
      taskEndDate > workflowEndDate ||
      taskStartDate >= taskEndDate
    ) {
      return res.status(403).json({
        success: false,
        message: "Ngày kết thúc không hợp lệ",
      });
    }
    const newRow = await TaskController.insert(taskData);
    if (!newRow) {
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
router.delete("/:id", checkToken(), async (req, res) => {
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
      const checkIsPermissons =
        await RoleProjectPermissiomController.checkIsPermissons(
          task.workflow.projectId,
          role.roleId,
          "deleteTask"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const deleteRow = await TaskController.delete(taskId);
    const statusCode = deleteRow.success ? 200 : 400;
    return res.status(statusCode).json(deleteRow);
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
    const taskId = req.params.id;
    const user = req.user;
    const newData = req.body;
    if (!taskId || !newData) {
      return res.status(400).json({
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
          "updateTask"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      if (role.attendId !== task.createBy && role.roleId === "SEO_Specialist") {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const workflowStartDate = new Date(task.workflow.startDate);
    workflowStartDate.setHours(0, 0, 0, 0);
    const workflowEndDate = new Date(task.workflow.endDate);
    workflowEndDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentStartDate = new Date(task.startDate);
    currentStartDate.setHours(0, 0, 0, 0);
    let startDate = currentStartDate;
    if (newData.startDate) {
      startDate = new Date(newData.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (
        startDate.getTime() !== currentStartDate.getTime() &&
        (startDate < workflowStartDate ||
          startDate > workflowEndDate ||
          startDate < now)
      ) {
        return res.status(401).json({
          success: false,
          message: "Ngày bắt đầu không hợp lệ",
        });
      }
    }
    const currentEndDate = new Date(task.endDate);
    currentEndDate.setHours(0, 0, 0, 0);
    let endDate = currentEndDate;
    if (newData.endDate) {
      endDate = new Date(newData.endDate);
      endDate.setHours(0, 0, 0, 0);
      if (
        (endDate.getTime() !== currentEndDate.getTime() &&
          endDate < workflowStartDate) ||
        endDate > workflowEndDate ||
        endDate < startDate
      ) {
        return res.status(403).json({
          success: false,
          message: "Ngày kết thúc không hợp lệ",
        });
      }
    }
    const updateRow = await TaskController.update(taskId, newData);
    if (!updateRow) {
      return res.status(400).json({
        success: false,
        message: "Cập nhật thất bại",
      });
    }
    const notification = await NotificationContronller.insertNotification(
      `Công việc ${task.title} đã được thay đổi bởi ${user.fullname} `,
      task.workflow.projectId,
      role.attendId,
      { transaction }
    );
    if (!notification) {
      return res.status(400).json({
        success: false,
        message: "Không thể thêm thông báo",
      });
    }
    const assignTask = await AssignTaskController.getAssignTaskbyTaskId(
      task.taskId
    );
    for (const item of assignTask) {
      const attend = await AttendController.getAttendById(item.attendId);
      if (attend.attendId !== role.roleId && attend.roleId !== "SEO_Manager") {
        await NotificationAttendController.insertNotificarionAttend(
          notification.notificationId,
          attend.attendId,
          { transaction }
        );
        await sendMailNotification(
          attend.user?.email,
          `Thông tin của công việc ${task.title} đã được cập nhật `,
          task.workflow?.project?.name,
          `${process.env.CLIENT_URL}?projectId=${task.workflow?.projectId}&taskId=${task.taskId}`
        );
      }
    }
    const SEOManager = await AttendController.getUserByProjectIdRoleId(
      task.workflow?.projectId,
      "SEO_Manager"
    );
    if (!SEOManager) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thất SEO Manager của dự án",
      });
    }
    for (const item of SEOManager) {
      const alreadyAssigned = assignTask.some(
        (a) => a.attendId === item.attendId
      );
      if (alreadyAssigned) continue;
      await NotificationAttendController.insertNotificarionAttend(
        notification.notificationId,
        item.attendId,
        { transaction }
      );
      await sendMailNotification(
        item.email,
        `Thông tin của công việc ${task.title} đã được cập nhật `,
        task.workflow?.project?.name,
        `${process.env.CLIENT_URL}?projectId=${task.workflow?.projectId}&taskId=${task.taskId}`
      );
    }
    await transaction.commit();
    if (newData.status === "Hoàn thành") {
      await AssignTaskController.updateTaskByStatusSuccess(task.taskId);
    } else {
      await AssignTaskController.updateTaskByStatusNotSuccess(task.taskId);
    }
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
router.get("/", checkToken(), async (req, res) => {
  try {
    const user = req.user;
    if (user.roleType !== "Admin System") {
      return res.status(402).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const tasks = await TaskController.getAllTask();
    return res.status(200).json({
      success: true,
      tasks,
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
      const checkIsPermissons =
        await RoleProjectPermissiomController.checkIsPermissons(
          task.workflow.projectId,
          role.roleId,
          "viewTask"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});
router.get("/getTaskbyWorkflow/:id", checkToken(), async (req, res) => {
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
        message: "Không tìm thấy workflow",
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
      const checkIsPermissons =
        await RoleProjectPermissiomController.checkIsPermissons(
          workflow.projectId,
          role.roleId,
          "viewTask"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const tasks = await TaskController.getTaskByWorkflowId(workflowId);
    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});
router.put("/updateStatus/:id", checkToken(), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const taskId = req.params.id;
    const user = req.user;
    const { status, note } = req.body;
    if (!status || !taskId) {
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
          "updateStatusTask"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const updateRow = await TaskController.updateStatus(taskId, status, note);
    if (!updateRow) {
      return res.status(400).json({
        success: false,
        message: "Cập nhật thất bại",
      });
    }
    const notification = await NotificationContronller.insertNotification(
      `Trạng thái công việc ${task.title} đã được cập nhật`,
      task.workflow.projectId,
      role.attendId,
      { transaction }
    );
    if (!notification) {
      return res.status(400).json({
        success: false,
        message: "Không thể thêm thông báo",
      });
    }
    const assignTask = await AssignTaskController.getAssignTaskbyTaskId(
      task.taskId
    );

    for (const item of assignTask) {
      const attend = await AttendController.getAttendById(item.attendId);
      if (attend.attendId !== role.roleId) {
        await NotificationAttendController.insertNotificarionAttend(
          notification.notificationId,
          attend.attendId,
          { transaction }
        );
        await sendMailNotification(
          attend.user?.email,
          `Trạng thái của công việc ${task.title} đã được cập nhật thành ${status}`,
          task.workflow?.project?.name,
          `${process.env.CLIENT_URL}?projectId=${task.workflow?.projectId}&taskId=${task.taskId}`
        );
      }
    }
    const SEOManager = await AttendController.getUserByProjectIdRoleId(
      task.workflow?.projectId,
      "SEO_Manager"
    );

    if (!SEOManager || SEOManager.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy SEO Manager của dự án",
      });
    }
    for (const item of SEOManager) {
      const alreadyAssigned = assignTask.some(
        (a) => a.attendId === item.attendId
      );
      if (alreadyAssigned) continue;
      await NotificationAttendController.insertNotificarionAttend(
        notification.notificationId,
        item.attendId,
        { transaction }
      );
      await sendMailNotification(
        item.email,
        `Trạng thái của công việc ${task.title} đã được cập nhật thành ${status}`,
        task.workflow?.project?.name,
        `${process.env.CLIENT_URL}?projectId=${task.workflow?.projectId}&taskId=${task.taskId}`
      );
    }
    await transaction.commit();
    if (status === "Hoàn thành") {
      await AssignTaskController.updateTaskByStatusSuccess(task.taskId);
    } else {
      await AssignTaskController.updateTaskByStatusNotSuccess(task.taskId);
    }
    return res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
    });
  } catch (error) {
    await transaction.rollback();
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});
router.get("/getProjectbyTaskId/:id", checkToken(), async (req, res) => {
  try {
    const taskId = req.params.id;
    const user = req.user;
    if (!taskId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const tasks = await TaskController.getProjectByTaskId(taskId);
    if (!tasks) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    if (user.roleType !== "Admin System") {
      const role = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        tasks.workflow.projectId
      );
      if (!role) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      const checkIsPermissons =
        await RoleProjectPermissiomController.checkIsPermissons(
          tasks.workflow.projectId,
          role.roleId,
          "viewTask"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});
router.get("/getTaskByProjectId/:id", checkToken(), async (req, res) => {
  try {
    const projectId = req.params.id;
    const user = req.user;
    if (!projectId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const role = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      projectId
    );
    if (user.roleType !== "Admin System") {
      if (!role) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const task = await TaskController.getTaskByProjectId(projectId);

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/getTaskByProjectIdRole/:id", checkToken(), async (req, res) => {
  try {
    const projectId = req.params.id;
    const user = req.user;
    if (!projectId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const role = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      projectId
    );
    let task = await TaskController.getTaskByProjectId(projectId);
    if (user.roleType !== "Admin System") {
      if (!role) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      if (role.roleId !== "SEO_Manager" && role.roleId !== "Guest") {
        task = await TaskController.getTaskByProjectIdUserId(
          projectId,
          user.userId
        );
      }
    }
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});
router.get("searchTask", checkToken(), async (req, res) => {
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
    const result = await TaskController.searchTask(keyword);
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

router.post("/genarateChecklist/:id", checkToken(), async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await TaskController.getTaskId(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    const prompt = `Bạn là chuyên gia SEO & quản lý dự án có nhiều năm kinh nghiệm trong việc lên kế hoạch cho các dự án quản lý SEO.

Nhiệm vụ của bạn:
- Phân tích thông tin công việc tôi cung cấp.
- Tự suy ra các bước thực hiện cần thiết để hoàn thành công việc đó.
- Các bước phải phản ánh đúng bản chất và phạm vi công việc, không dùng checklist chung chung.
- Ưu tiên tạo checklist theo hướng SEO nếu công việc liên quan đến SEO.
- Nếu công việc không liên quan SEO, hãy tạo checklist tương ứng theo đúng lĩnh vực.

⚠️ QUY TẮC TRẢ VỀ:
1. Trả về **duy nhất** một mảng JSON (không bao gồm bất kỳ giải thích hay văn bản nào khác).
2. Mỗi phần tử trong mảng là một object có:
   - id: số thứ tự (bắt đầu từ 1)
   - task: mô tả ngắn gọn bước công việc
3. Số lượng bước tùy thuộc vào mức độ chi tiết của công việc.
4. Các bước phải được sắp xếp theo **trình tự thực hiện hợp lý**.

Thông tin đầu vào: 
Tên công việc: ${task.title}  
Ngày bắt đầu: ${task.startDate} 
Ngày kết thúc: ${task.endDate} 
Mô tả: ${task.description}

---

📌 **Ví dụ:**

**Kết quả JSON mong muốn:**
[
  { "id": 1, "task": "Xác định tiêu chí lựa chọn và thu thập danh sách top 3 đối thủ" },
  { "id": 2, "task": "Thu thập dữ liệu về bộ từ khóa mà đối thủ đang tối ưu" },
  { "id": 3, "task": "Phân tích cấu trúc website và cấu trúc URL của từng đối thủ" },
  { "id": 4, "task": "Đánh giá nội dung, mật độ từ khóa và mức độ tối ưu On-page"},
  { "id": 5, "task": "Phân tích hồ sơ backlink và nguồn liên kết của đối thủ"},
  { "id": 6, "task": "Đánh giá tốc độ tải trang và Core Web Vitals"},
  { "id": 7, "task": "Kiểm tra khả năng tối ưu hiển thị trên thiết bị di động"},
  { "id": 8, "task": "Tổng hợp dữ liệu và so sánh chiến lược SEO của các đối thủ"}
]
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

module.exports = router;
