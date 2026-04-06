const JWTHandler = require("./JWTHandler");

const authenticateToken = (req, res, next) => {
  const jwthandler = new JWTHandler();
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  const user = jwthandler.verifyToken(token);
  if (!user) return res.sendStatus(403); 
  req.user = user;
  next();
};

module.exports = authenticateToken;
