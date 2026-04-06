const express = require("express");
const checkToken = require("../middleware/checkToken");
const RoleController = require("../controller/RoleController");

const router = express.Router();

router.get("/", checkToken(), async(req, res)=>{
    try {
        const user = req.user;
        const role = await RoleController.getAllRole();
        return res.status(200).json({
            success : true,
            role
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success : false,
            message : "Lỗi server"
        })
    }
});

module.exports = router;