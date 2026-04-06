const express = require("express");
const checkToken = require("../middleware/checkToken");
const ProjectController = require("../controller/ProjectController");
const RoleProjectPermissiomController = require("../controller/RoleProjectPermissionController");
const AttendController = require("../controller/AttendController");
const attend = require("../models/attend");

const router = express.Router();

router.post("/", checkToken(), async (req, res) => {
  try {
    const { roleId, permissionId, projectId } = req.body;
    console.log(roleId);
    const user = req.user;
    if (!roleId || !permissionId || !projectId) {
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
        project.projectId
      );
      if (!role) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      const checkIsPermissons =
        await RoleProjectPermissiomController.checkIsPermissons(
          project.projectId,
          role.roleId,
          "customerPermission"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const newRow = await RoleProjectPermissiomController.insertPermissions(
      projectId,
      roleId,
      permissionId
    );
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

router.delete("/", checkToken(), async (req, res) => {
  try {
    const { roleId, permissionId, projectId } = req.query;
    const user = req.user;
    if (!roleId || !permissionId || !projectId) {
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
        project.projectId
      );
      if (!role) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      const checkIsPermissons =
        await RoleProjectPermissiomController.checkIsPermissons(
          project.projectId,
          role.roleId,
          "customerPermission"
        );
      if (!checkIsPermissons) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const deleteRow = await RoleProjectPermissiomController.deletePermissions(
      project.projectId,
      roleId,
      permissionId
    );
    if (!deleteRow) {
      return res.status(400).json({
        success: false,
        message: "Xóa không thành công",
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

router.get(
  "/getPermisisonsByPRojectIdRoleId",
  checkToken(),
  async (req, res) => {
    try {
      const { roleId, projectId } = req.query;
      const user = req.user;
      if (!roleId || !projectId) {
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
      const permisions =
        await RoleProjectPermissiomController.getPermissionByProjectIdRoleId(
          project.projectId,
          roleId
        );
      return res.status(200).json({
        success: true,
        permisions,
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

router.post("/checkPermissioms", checkToken(), async (req, res) => {
  try {
    const { projectId, permissionId } = req.body;
    const user = req.user;
    const attend = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      projectId
    );
    if(!projectId || !permissionId){
      return res.status(401).json({
        success : false,
        message : "Dữ liệu không hợp lệ"
      })
    }
    if (user.roleType !== "Admin System") {
      if (!attend) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      const checkIsPermissons = await RoleProjectPermissiomController.checkIsPermissons(projectId, attend.roleId, permissionId);
      if(!checkIsPermissons){
        return res.status(200).json({
          success : false,
          message : "Bạn không có quyền"
        })
      }
    }
    return res.status(200).json({
      success : true,
      message : "Bạn được phép"
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

module.exports = router;
