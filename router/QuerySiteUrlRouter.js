const express = require("express");
const ProjectController = require("../controller/ProjectController");
const AttendController = require("../controller/AttendController");
const RoleProjectPermissiomController = require("../controller/RoleProjectPermissionController");
const QuerySiteController = require("../controller/QuerySiteUrlController");
const checkToken = require("../middleware/checkToken");
const SiteUrlController = require("../controller/SiteUrlController");
const router = express.Router();

router.get("/getQueryByProject/:id", checkToken(), async (req, res) => {
  try {
    const projectId = req.params.id;
    const user = req.user;
    const project = await ProjectController.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        messaga: "Dữ án không hợp lệ",
      });
    }
    if (user.roleType !== "Admin System") {
      const attend = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        projectId
      );
      if (!attend) {
        return res.status(403).json({
          success: false,
          messaga: "Bạn không có quyền",
        });
      }
      const checkPermisison =
        await RoleProjectPermissiomController.checkIsPermissons(
          projectId,
          attend.roleId,
          "viewGoogleSearch"
        );
      if (!checkPermisison) {
        return res.status(403).json({
          success: false,
          messaga: "Bạn không có quyền",
        });
      }
    }
    const query = await QuerySiteController.getQueryByProject(projectId);
    return res.status(200).json({
      success: true,
      query,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      messaga: "Lỗi server",
    });
  }
});

router.post("/", checkToken(), async (req, res) => {
  try {
    const keyWord = req.body;
    const user = req.user;
    if (!keyWord.query || !keyWord.type || !keyWord.projectId) {
      return res.status(400).json({
        success: false,
        messaga: "Dữ liệu không hợp lệ",
      });
    }
    const site = await SiteUrlController.getSiteUrlByProjectId(
      keyWord.projectId
    );
    if (!site) {
      return res.status(404).json({
        success: false,
        messaga: "Không tìm thấy dữ liệu",
      });
    }
    const attend = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      site.projectId
    );
    if (!attend) {
      return res.status(403).json({
        success: false,
        messaga: "Bạn không có quyền",
      });
    }
    const checkIsPermissons =
      await RoleProjectPermissiomController.checkIsPermissons(
        site.projectId,
        attend.roleId,
        "viewGoogleSearch"
      );
    if (!checkIsPermissons) {
      return res.status(403).json({
        success: false,
        messaga: "Bạn không có quyền",
      });
    }
    delete keyWord.projectId;
    keyWord.siteId = site.siteId;
    const result = await QuerySiteController.insert(keyWord);
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      messaga: "Lỗi server",
    });
  }
});

router.delete("/:id", checkToken(), async (req, res) => {
  try {
    const queryId = req.params.id;
    const user = req.user;
    if (!queryId) {
      return res.status(400).json({
        success: false,
        messaga: "Dữ liệu không hợp lệ",
      });
    }
    const query = await QuerySiteController.getQueryById(queryId);
    if (!query) {
      return res.status(404).json({
        success: false,
        messaga: "Không tìm thấy dữ liệu",
      });
    }
    const site = await SiteUrlController.getSiteUrlById(query.siteId);
    const attend = await AttendController.getRoleIdByUserIdProjectId(
      user.userId,
      site.projectId
    );
    if (!attend) {
      return res.status(403).json({
        success: false,
        messaga: "Bạn không có quyền",
      });
    }
    const checkPermission =
      await RoleProjectPermissiomController.checkIsPermissons(
        site.projectId,
        attend.roleId,
        "viewGoogleSearch"
      );
    if (!checkPermission) {
      return res.status(403).json({
        success: false,
        messaga: "Bạn không có quyền",
      });
    }
    const deleteRow = await QuerySiteController.delete(queryId);
    if (!deleteRow) {
      return res.status(400).json({
        success: false,
        messaga: "Xóa thất bại",
      });
    }
    return res.status(200).json({
      success: true,
      messaga: "Xóa thành công"
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      messaga: "Lỗi server",
    });
  }
});

module.exports = router;
