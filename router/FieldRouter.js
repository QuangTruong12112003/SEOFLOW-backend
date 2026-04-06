const express = require("express");
const checkToken = require("../middleware/checkToken");
const FieldController = require("../controller/fieldController");
const router = express.Router();

router.get("/", checkToken(), async(req, res) => {
    try {
        const fields = await FieldController.getAll();
        return res.status(200).json({
            success: true,
            fields
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server"
        })
    }
})

module.exports = router;