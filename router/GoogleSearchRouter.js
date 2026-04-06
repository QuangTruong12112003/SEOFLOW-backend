const express = require("express");
const { google } = require("googleapis");
const checkToken = require("../middleware/checkToken");
const router = express.Router();
const SiteUrlController = require("../controller/SiteUrlController");
const AttendController = require("../controller/AttendController");
const RoleProjectPermissionController = require("../controller/RoleProjectPermissionController");
const ProjectController = require("../controller/ProjectController");
const passport = require("passport");
const JWTHandler = require("../middleware/JWTHandler");

function getOAuthClient(refreshToken) {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    ""
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
}

router.get("/api/gsc/keyword", checkToken(), async (req, res) => {
  try {
    const user = req.user;
    const { projectId, start, end, keyword, dimension } = req.query;

    if (!projectId || !start || !end ||!dimension || !keyword) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }

    const record = await SiteUrlController.getSiteUrlByProjectId(projectId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }

    if (!record.project?.createBy_user?.refreshtoken) {
      return res.status(403).json({
        success: false,
        message: "Người tạo dự án chưa xác thực Google Search Console",
      });
    }

    if (user.roleType !== "Admin System") {
      const role = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        projectId
      );
      if (!role) {
        return res.status(401).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }

      const permisison = await RoleProjectPermissionController.checkIsPermissons(
        projectId,
        role.roleId,
        "viewGoogleSearch"
      );
      if (!permisison) {
        return res.status(401).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }

    const auth = getOAuthClient(record.project?.createBy_user?.refreshtoken);
    const gsc = google.searchconsole({ version: "v1", auth });

    const requestBody = {
      startDate: start,
      endDate: end,
      rowLimit: 1000,
      dimensions: ["date", dimension],
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: dimension,
              operator: "equals",
              expression: keyword,
            },
          ],
        },
      ],
    };

    const response = await gsc.searchanalytics.query({
      siteUrl: record.url,
      requestBody,
    });

    const data = (response.data.rows || []).map((r) => {
      const [dateKey, queryKey] = r.keys;
      return {
        date: dateKey,
        query: queryKey,
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      };
    });

    res.status(200).json({
      success: true,
      site: record.url,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/api/gsc/overview", checkToken(), async (req, res) => {
  try {
    const user = req.user;
    const { projectId, start, end, dimension } = req.query;
    if (!projectId || !start || !end) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const record = await SiteUrlController.getSiteUrlByProjectId(projectId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    if (!record.project?.createBy_user?.refreshtoken) {
      return res.status(403).json({
        success: false,
        message: "Người tạo dự án chưa xác thực Google Search Console",
      });
    }
    if (!user.roleType === "Admin System") {
      const role = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        projectId
      );
      if (!role) {
        return res.status(401).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      const permisison =
        await RoleProjectPermissionController.checkIsPermissons(
          projectId,
          role.roleId,
          "viewGoogleSearch"
        );
      if (!permisison) {
        return res.status(401).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }

    const auth = getOAuthClient(record.project?.createBy_user?.refreshtoken);
    const gsc = google.searchconsole({ version: "v1", auth });

    const requestBody = {
      startDate: start,
      endDate: end,
      rowLimit: 1000,
    };

    if (dimension) {
      requestBody.dimensions = [dimension];
    }
    const response = await gsc.searchanalytics.query({
      siteUrl: record.url,
      requestBody,
    });

    const data = (response.data.rows || []).map((r) => {
      const item = {
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      };
      if (dimension) item.key = r.keys[0];
      return item;
    });

    res.status(200).json({
      success: true,
      site: record.url,
      dimension: dimension || null,
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

router.get("/verifyUserCreateProject", checkToken(), async (req, res) => {
  try {
    const { projectId } = req.query;
    const user = req.user;
    if (!projectId) {
      return res.status(400).json({
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
    if (project.createBy !== user.userId) {
      return res.status(403).json({
        success: false,
        message: "Lỗi xác thực",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Xác minh thành công",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/api/gsc/auth/google", (req, res, next) => {
  const { projectId, userId } = req.query;

  const state = JSON.stringify({ projectId, userId });

  passport.authenticate("gsc-google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/webmasters.readonly",
    ],
    accessType: "offline",
    prompt: "consent",
    state,
  })(req, res, next);
});

router.get("/api/gsc/auth/google/callback", (req, res, next) => {
  passport.authenticate("gsc-google", { session: false }, (err, user, info) => {
    const { projectId } = JSON.parse(req.query.state || "{}");
    let token;
    const jwthandler = new JWTHandler();
    if (err || !user) {
      token = jwthandler.generateToken({ verified: false }, 300);
    } else {
      token = jwthandler.generateToken({ verified: true }, 300);
    }
    req.user = user;
    return res.redirect(
      `${process.env.CLIENT_URL}project/${projectId}/googlesearch?token=${token}`
    );
  })(req, res, next);
});

router.get("/checkToken", checkToken(), async (req, res) => {
  try {
    const jwthandler = new JWTHandler();
    const token = req.query.token;
    const verified = jwthandler.verifyToken(token);
    return res.status(200).json({
      verified,
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
    const { url, projectId, createAt } = req.body;
    const user = req.user;
    if (!url || !projectId || !createAt) {
      return res.status(400).json({
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
    if (project.createBy !== user.userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const newRow = await SiteUrlController.insertSiteUrl({
      url,
      projectId,
      createAt,
    });
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

router.get("/getSiteUrlByProjectId/:id", checkToken(), async (req, res) => {
  try {
    const projectId = req.params.id;
    const user = req.user;
    if (!projectId) {
      return res.status(400).json({
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
        return res.status(401).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const siteUrl = await SiteUrlController.getSiteUrlByProjectId(
      project.projectId
    );
    if (!siteUrl) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    return res.status(200).json({
      success: true,
      siteUrl,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.put("/updateSite/:id", checkToken(), async (req, res) => {
  try {
    const newData = req.body;
    const siteId = req.params.id;
    if (!newData.url) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const site = await SiteUrlController.getSiteUrlById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    const updateRow = await SiteUrlController.updateStiteUrl(
      site.siteId,
      newData
    );
    if (!updateRow) {
      return res.status(400).json({
        success: false,
        message: "Cập nhật thất bại",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
});

router.delete("/deleteSiteurl/:id", checkToken(), async (req, res) => {
  try {
    const siteId = req.params.id;
    const user = req.user;
    const site = await SiteUrlController.getSiteUrlById(siteId);

    if (user.roleType !== "Admin System") {
      const attend = await AttendController.getRoleIdByUserIdProjectId(
        user.userId,
        site.projectId
      );
      if (!attend) {
        return res.status(401).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
      if (user.userId !== site.project?.createBy) {
        return res.status(401).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const deleteRow = await SiteUrlController.deleteSiteUrl(siteId);
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

module.exports = router;
