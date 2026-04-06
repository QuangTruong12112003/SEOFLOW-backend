const bcrypt = require('bcrypt');

class passwordHandler{
    static async hashedPassword (password){
       try {
        const saltRpunds = 10;
        const hashedPassword = await bcrypt.hash(password,saltRpunds);
        return hashedPassword;
       } catch (error) {
            console.log(error);
            return null;
       }
    }

    static async verifyPassword (inputPassword, passwordFormDB) {
        try {
            const match = await bcrypt.compare(inputPassword, passwordFormDB);
            return match;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
}
module.exports = passwordHandler;