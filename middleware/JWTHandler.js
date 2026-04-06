const fs = require('fs');
const jwt = require('jsonwebtoken');

class JWTHandler {
    constructor(){
        this.issuer = "http://192.168.1.4";
        this.audience = "http://192.168.1.4";
    }

    generateToken(userData, expInSeconds){
        const issueAt = Math.floor(Date.now() / 1000);
        const expire = issueAt + expInSeconds;

        const privateKey = fs.readFileSync('../backend/config/private_key.pem', 'utf8');

        const payload = {
            iss : this.issuer,
            aud : this.audience,
            iat : issueAt,
            exp : expire,
            data : userData
        };

        return jwt.sign(payload, privateKey, {algorithm : 'RS256'});
    }

    verifyToken(jwtToken){
        try{
            const publicKey = fs.readFileSync('../backend/config/public_key.pem', 'utf8');

            const decoded = jwt.verify(jwtToken, publicKey, {algorithms : ['RS256']});
            return decoded.data;
        }catch(error)
        {
            return false;
        }
    }
}

module.exports = JWTHandler;