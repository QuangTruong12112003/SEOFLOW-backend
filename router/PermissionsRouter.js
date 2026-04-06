const express = require("express");
const PermissionsController = require("../controller/PermissionsController");
const checkToken = require("../middleware/checkToken");
const router = express.Router();

router.get('/', checkToken(), async(req, res)=>{
    try {
        const permissions = await PermissionsController.getAllPermissionConfig();
        return res.status(200).json({
            success : true,
            permissions
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success : false,
            messega : "Lỗi server"
        })
    }
});


module.exports = router