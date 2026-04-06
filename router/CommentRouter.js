const express = require("express");
const sequelize = require("../config/database");
const checkToken = require("../middleware/checkToken");
const {
  createUploader,
  handleUploadError,
  safeUploader,
} = require("../middleware/uploadHelper");
const AttendController = require("../controller/AttendController");
const TaskController = require("../controller/TaskController");
const AssignTaskController = require("../controller/AssignTaskController");
const RoleProjectPermissiomController = require("../controller/RoleProjectPermissionController");
const CommentController = require("../controller/CommentController");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const uploader = createUploader({
  folder: "FileComments",
  allowedTypes: [".jpg", ".jpeg", ".png", ".docx", ".pdf", ".xlsm"],
});

const uploadFile = handleUploadError(uploader.single("file"));

router.post("/", checkToken(), uploadFile, async (req, res, next) => {
  try {
    await safeUploader(
      req,
      res,
      next,
      async () => {
        const newData = req.body;
        const user = req.user;
        if (!newData.commentId || !newData.content || !newData.taskId) {
          throw new Error("Dữ liệu không hợp lệ");
        }
        const task = await TaskController.getTaskId(newData.taskId);
        if (!task) {
          throw new Error("Không tìm thấy công việc");
        }
        if (user.roleType !== "Admin System") {
          const role =
            await AttendController.getRoleIdByUserIdProjectId(
              user.userId,
              task.workflow.projectId
            );
          if (!role) {
            throw new Error("Bạn không có quyền");
          }
          const checkIsPermissons =
            await RoleProjectPermissiomController.checkIsPermissons(
              task.workflow.projectId,
              role.roleId,
              "insertComment"
            );
          if (!checkIsPermissons) {
            throw new Error("Bạn không có quyền");
          }
          if (
            role.roleId === "SEO_Specialist" ||
            role.roleId === "Content_Writer"
          ) {
            const checkExistingUserInTask =
              await AssignTaskController.checkExistingUserInTask(
                task.taskId,
                user.userId
              );
            if (!checkExistingUserInTask) {
              throw new Error("Bạn không có quyền");
            }
          }
        }
        const file = req.file
          ? `/uploads/FileComments/${req.file.filename}`
          : null;
        const attend = await AttendController.getRoleIdByUserIdProjectId(user.userId, task.workflow.projectId);
        newData.fileUrl = file;
        newData.createBy = attend.attendId;
        newData.createAt = new Date();
        const newRow = await CommentController.insertComment(newData);
        if (!newRow) {
          throw new Error("Thêm thấy bại");
        }
        return res.status(200).json({
          success: true,
          message: "Thêm thành công",
        });
      },
      {
        folder: "FileComments",
      }
    );
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
    const commentId = req.params.id;
    const user = req.user;
    if (!commentId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const comment = await CommentController.getCommentById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bình luận",
      });
    }
    const task = await TaskController.getTaskId(comment.taskId);
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
      if (role.roleType !== "SEO_Manager" && user.userId !== comment.createBy) {
        return res.status(402).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }
    }
    const filePath = comment.fileUrl
      ? path.join(
          __dirname,
          "..",
          "uploads",
          "FileComments",
          path.basename(comment.fileUrl)
        )
      : null;
    const result = await CommentController.deleteComment(commentId);
    if (result && filePath) {
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
        const commentId = req.params.id;
        const user = req.user;
        const newData = req.body;
        if(newData.commentId){
          delete newData.commentId;
        }
        if(newData.createBy){
          delete newData.createBy;
        }
        if(!commentId) throw new Error("Dữ liệu không hợp lệ")
        const oldComment = await CommentController.getCommentById(commentId);
        if (!oldComment) throw new Error("Không tìm thấy bình luận");
        const task = await TaskController.getTaskId(oldComment.taskId);
        const attend = await AttendController.getRoleIdByUserIdProjectId(user.userId, task.workflow.projectId);
        if (
          user.roleType !== "Admin System" &&
          attend.attendId !== oldComment.createBy
        )
          throw new Error("Bạn không có quyền");

        let filePath = oldComment.filePath;
        let newFileUploaded = false;

        if (req.file) {
          newFileUploaded = true;
          filePath = `/uploads/FileComments/${req.file.filename}`;
        }

        newData.fileUrl = filePath;
        const updated = await CommentController.updateComment(
          commentId,
          newData,
          { transaction }
        );
        if (!updated) throw new Error("Cập nhật người dùng thất bại");

        if (
          newFileUploaded &&
          oldComment.fileUrl &&
          oldComment.fileUrl !== filePath
        ) {
          const oldFilePath = path.join(
            __dirname,
            "..",
            "uploads",
            "FileComments",
            path.basename(oldComment.fileUrl)
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
        folder: "FileComments",
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

router.get("/getCommentByTaskId/:id", checkToken(), async(req, res)=>{
  try {
    const taskId = req.params.id;
    const user = req.user;
    if(!taskId){
      return res.status(401).json({
        success : false,
        message : "Dữ liệu không hợp lệ"
      });
    }
    const task = await TaskController.getTaskId(taskId);
    if(!task){
      return res.status(404).json({
        success : false,
        message : "Không tìm thấy công việc"
      });
    }
    if(user.role !== "Admin System"){
      const role = await AttendController.getRoleIdByUserIdProjectId(user.userId, task.workflow.projectId);
      if(!role){
        return res.status(402).json({
          success: false,
          message: "Bạn Không có quyền"
        })
      }
    }
    const comments = await CommentController.getCommentByTaskId(taskId);
    if(!comments){
      return res.status(404).json({
        success : false,
        message : "Không tìm thấy dữ liệu"
      })
    }
    return res.status(200).json({
      success : true,
      comments
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success : false,
      message : "Lỗi server"
    })
  }
});

router.get("/getCommentByUserId", checkToken(), async(req, res)=>{
  try {
    const user = req.user;
    const {userId, projectId} = req.query;
    if(!userId || !projectId){
      return res.status(401).json({
        success : false,
        message : "Dữ liệu không hợp lệ"
      })
    }
    if(user.roleType !== "Admin System"){
      const role = await AttendController.getRoleIdByUserIdProjectId(user.userId, projectId);
      if(!role){
        return res.status(402).json({
          success : false,
          message: "Bạn không có quyền"
        })
      }
      if(role.roleId !== "SEO_Manager"){
        if(user.userId !== userId){
          return res.status(402).json({
            success : false,
            message :"Bạn không có quyền"
          })
        }
      }
    }
    const comments = await CommentController.getCommentByUserId(userId);
    return res.status(200).json({
      success : true,
      comments
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success : false,
      message : "Lỗi server"
    })
  }
})

module.exports = router;
