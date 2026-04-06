const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const UserController = require("../controller/UserController");
const JWTHandler = require("./JWTHandler");

const handleID = (type) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `0${now.getMonth() + 1}`.slice(-2);
  const date = `0${now.getDate()}`.slice(-2);
  const hours = `0${now.getHours()}`.slice(-2);
  const minutes = `0${now.getMinutes()}`.slice(-2);
  const seconds = `0${now.getSeconds()}`.slice(-2);

  return `${type}${year}${month}${date}${hours}${minutes}${seconds}`;
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/user/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const userId = handleID("USR");
        const email = profile.emails[0].value;
        const fullname = profile.displayName;

        console.log(refreshToken);

        let user = await UserController.getUserByEmail(email);

        if (!user) {
          user = await UserController.insertUser({
            userId: userId,
            email: email,
            fullname: fullname,
            status: 1,
            refreshtoken: refreshToken,
          });

          if (!user) {
            return done(null, false);
          }
        }
        await UserController.updateUser(user.userId, {
          status: 1,
          refreshtoken: refreshToken,
        });

        const jwthandler = new JWTHandler();
        const token = jwthandler.generateToken(user, 3600);
        return done(null, { user, token });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((data, done) => done(null, data));
passport.deserializeUser((data, done) => done(null, data));
