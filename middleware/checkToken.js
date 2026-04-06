const JWTHandler = require("../middleware/JWTHandler");

function checkToken(){
    return(req, res, next)=>{
        try{
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")){
                return res.status(401).json({ success: false, message: "Token không hợp lệ" });
            }
            const token = authHeader.split("Bearer ")[1];
            const jwthandler = new JWTHandler();
            const user = jwthandler.verifyToken(token);
            if(!user || !user.roleType){
                return res.status(404).json({success : false, message : "Bạn không có quyền"});
            }
            req.user = user;
            next();
        }catch(error){
            console.error("Lỗi xác thực hoặc kiểm trả quyền: ", error.message);
            return res.status(401).json({
                success : false,
                message : "Token hết hạn hoặc không hợp lệ"
            });
        }
    }
}

module.exports = checkToken;