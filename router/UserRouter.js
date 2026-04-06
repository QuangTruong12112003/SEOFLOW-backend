const express = require("express");
require("dotenv").config();
const UserController = require("../controller/UserController");
const passwordHandler = require("../middleware/passwordHandler");
const JWTHandler = require("../middleware/JWTHandler");
const { sendOtpEmail, sendChangePass } = require("../middleware/sendOtp");
const { createClient } = require("redis");
const passport = require("passport");
const authenticateToken = require("../middleware/authenticateToken");
const checkToken = require("../middleware/checkToken");
const {
  createUploader,
  handleUploadError,
  safeUploader,
} = require("../middleware/uploadHelper");
const fs = require("fs");
const path = require("path");

const redisClient = createClient();

redisClient.on("error", (err) => console.error("Redis error:", err));

redisClient.connect();

const router = express.Router();

const uploader = createUploader({
  folder: "userAvatars",
  allowedTypes: [".jpg", ".jpeg", ".png"],
});

const uploadAvatar = handleUploadError(uploader.single("image"));

function generateOTP() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

router.get("/searchUser", checkToken(), async (req, res) => {
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
    const result = await UserController.searchUser(keyword);
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

router.get("/getUserAccount/", checkToken(), async (req, res) => {
  try {
    const user = req.user;
    const detailUser = await UserController.getUserById(user.userId);
    if (!detailUser) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    return res.status(200).json({
      success: true,
      user: detailUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.post("/register", async (req, res) => {
  try {
    const userData = req.body;
    const newUser = await UserController.insertUser(userData);
    if (!newUser) {
      return res.status(400).json({
        success: false,
        message: "Thêm thấy bại",
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
      message: "Lỗi Server",
    });
  }
});

router.post("/", checkToken(), async (req, res) => {
  try {
    const user = req.user;
    const formData = req.body;
    if (!formData.email || !formData.userId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    if (user.roleType !== "Admin System") {
      return res.status(402).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }

    const users = await UserController.getUserByEmail(formData.email);
    if (users) {
      return res.status(403).json({
        success: false,
        message: "Người dùng đã tồn tại",
      });
    }
    const newUser = await UserController.insertUser(formData);
    if (!newUser) {
      return res.status(400).json({
        success: false,
        message: "Thêm thấy bại",
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
      message: "Lỗi servet",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const user = await UserController.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }
    const match = await passwordHandler.verifyPassword(password, user.password);
    if (!match) {
      return res.status(402).json({
        success: false,
        message: "Mât khẩu không đúng",
      });
    }
    const jwthandler = new JWTHandler();
    const token = jwthandler.generateToken(user, 3600);
    return res.status(200).json({
      success: true,
      user: user,
      token: token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.post("/loginAdmin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const user = await UserController.getEmailroleTypeAdmin(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }
    const match = await passwordHandler.verifyPassword(password, user.password);
    if (!match) {
      return res.status(402).json({
        success: false,
        message: "Mât khẩu không đúng",
      });
    }
    const jwthandler = new JWTHandler();
    const token = jwthandler.generateToken(user, 3600);
    return res.status(200).json({
      success: true,
      user: user,
      token: token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.get("/getEmail/:id", async (req, res) => {
  try {
    const email = req.params.id;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const user = await UserController.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.post("/sendGmail", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Thiếu gnmail",
      });
    }

    const otp = generateOTP();
    await sendOtpEmail(email, otp);
    await redisClient.setEx(`otp:${email}`, 600, otp);
    return res.status(200).json({
      success: true,
      message: "Đã gửi mail cho người dùng",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.post("/verifyOtp", async (req, res) => {
  const { email, otp } = req.body;

  const savedOtp = await redisClient.get(`otp:${email}`);

  if (!savedOtp) {
    return res
      .status(400)
      .json({ success: false, message: "OTP đã hết hạn hoặc không tồn tại" });
  }

  if (savedOtp !== otp) {
    return res
      .status(400)
      .json({ success: false, message: "Mã OTP không chính xác" });
  }

  await redisClient.del(`otp:${email}`);

  return res
    .status(200)
    .json({ success: true, message: "Xác minh OTP thành công" });
});

router.post("/sendGmailChangePass", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Thiếu gnmail hoặc đường dẫn",
      });
    }

    await sendChangePass(email);
    return res.status(200).json({
      success: true,
      message: "Đã gửi mail cho người dùng",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.post("/verifyTokenResetPass", async (req, res) => {
  const { token } = req.query;
  try {
    const handlejwt = new JWTHandler();
    const decoded = handlejwt.verifyToken(token);
    if (decoded === false) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }
    return res.status(200).json({
      success: true,
      decodedToken: decoded,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.put("/changePass/", async (req, res) => {
  try {
    const { token } = req.query;
    const formData = req.body;
    if (!formData.password) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const handlejwt = new JWTHandler();
    const decoded = await handlejwt.verifyToken(token);
    if (decoded === false) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }
    const email = decoded;
    const result = await UserController.updateUserByEmail(email, formData);
    if (!result) {
      return res.status(401).json({
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
    const users = await UserController.getAllUser();
    if (!users) {
      return res.status(404).json({
        success: false,
        message: "Không có dữ liệu",
      });
    }
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi serevr",
    });
  }
});
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/webmasters.readonly",
    ],
    accessType: "offline",
    prompt: "consent",
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const { token } = req.user;
    res.redirect(`${process.env.CLIENT_URL}oauth-success?token=${token}`);
  }
);

router.get("/me", authenticateToken, async (req, res) => {
  const user = req.user;
  const jwthandler = new JWTHandler();
  const token = jwthandler.generateToken(user, 3600);
  return res.status(200).json({
    success: true,
    user,
    token: token,
  });
});

router.put("/:id", checkToken(), uploadAvatar, async (req, res, next) => {
  await safeUploader(
    req,
    res,
    next,
    async () => {
      const userId = req.params.id;
      const currentUserId = req.user.userId;
      const currentUserRole = req.user.roleType;
      const newData = req.body;
      console.log(newData);
      delete newData.userId;

      const oldUser = await UserController.getUserById(userId);
      if (!oldUser) throw new Error("Không tìm thấy người dùng");

      if (currentUserRole !== "Admin System" && currentUserId !== userId) {
        throw new Error("Bạn không thể cập nhật dữ liệu của người khác");
      }

      let imgUrl = oldUser.imgUrl;
      let newFileUploaded = false;

      if (req.file) {
        newFileUploaded = true;
        imgUrl = `/uploads/userAvatars/${req.file.filename}`;
      }

      newData.imgUrl = imgUrl;
      const updated = await UserController.updateUser(userId, newData);
      if (!updated) throw new Error("Cập nhật người dùng thất bại");

      if (newFileUploaded && oldUser.imgUrl && oldUser.imgUrl !== imgUrl) {
        const oldFilePath = path.join(
          __dirname,
          "..",
          "uploads",
          "userAvatars",
          path.basename(oldUser.imgUrl)
        );
        fs.unlink(oldFilePath, (err) => {
          if (err) console.error("Lỗi xoá file cũ:", err);
        });
      }
      return res.status(200).json({
        success: true,
        message: "Cập nhật thành công",
      });
    },
    {
      folder: "userAvatars",
    }
  );
});

router.put("/updateAccount/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const formData = req.body;
    if (
      !formData.password ||
      !formData.birthday ||
      !formData.fullname ||
      !formData.status
    ) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const updateRow = await UserController.updateUser(userId, formData);
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
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

router.delete("/:id", checkToken(), async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUser = req.user;
    if (!currentUser || currentUser.roleType !== "Admin System") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa người dùng",
      });
    }
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const user = await UserController.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }
    const imagePath = user.imgUrl
      ? path.join(
          __dirname,
          "..",
          "uploads",
          "userAvatars",
          path.basename(user.imgUrl)
        )
      : null;
    const result = await UserController.deleteUser(userId);
    if (result.success && imagePath) {
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Lỗi xóa file ảnh:", err);
          return res.status(402).json({
            success: false,
            message: "Lỗi xóa file ảnh ",
          });
        } else {
          console.log("Đã xoá ảnh:", path.basename(imagePath));
        }
      });
    }
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

router.get("/:id", checkToken(), async (req, res) => {
  try {
    const userId = req.params.id;
    const user = req.user;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    if (user.roleType !== "Admin System") {
      return res.status(402).json({
        success: false,
        message: "Bạn không có quyền",
      });
    }
    const users = await UserController.getUserById(userId);
    if (!users) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu",
      });
    }
    return res.status(200).json({
      success: true,
      user: users,
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
