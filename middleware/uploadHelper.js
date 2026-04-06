const multer = require("multer");
const path = require("path");
const fs = require("fs");

const handleUploadError = (uploadMiddleware) => {
    return (req, res, next) => {
        uploadMiddleware(req, res, (err) => {
            if (err && err.code === "INVALID_FILE_TYPE"){
                return res.status(400).json({
                    success : false,
                    message : err.message
                });
            }

            if (err) {
                console.error("Upload error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Lỗi upload file"
                });
            }
            next();
        });
    };
};

const createUploader = ({folder = "uploads", allowedTypes = []}) => {
    const uploadPath =`./uploads/${folder}`;
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb)=>{
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const uniqueName = `${Date.now()}_${file.originalname}`;
            cb(null, uniqueName);
        }
    });

    const fileFilter = (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.length > 0 && !allowedTypes.includes(ext)) {
            const error = new Error(`Chỉ cho phép file: ${allowedTypes.join(", ")}`);
            error.code = "INVALID_FILE_TYPE";
            return cb(error, false);
        }
        cb(null, true);
    };

    return multer({storage, fileFilter});
};

const safeUploader = async(req, res, next, logicCallback,  options = {}) => {
    try {
        await logicCallback();
        next();
    } catch (error) {
        if (req.file) {
            const folder = options.folder || "";
            const filePath = path.join(__dirname, "..", "uploads", folder, req.file.filename);

            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Lỗi khi xoá file sau khi upload thất bại:", err);
                } else {
                    console.log("Đã xoá file vì thất bại:", req.file.filename);
                }
            });
        }

        console.error("SafeUploader Error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xử lý sau khi upload",
            error: error.message || "Unknown error"
        });
    }
};

module.exports = {
    handleUploadError,
    createUploader,
    safeUploader
};