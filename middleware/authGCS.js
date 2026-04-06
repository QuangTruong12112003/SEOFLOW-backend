const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const UserController = require("../controller/UserController");
const ProjectController = require("../controller/ProjectController");

passport.use(
  "gsc-google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/google/api/gsc/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const { projectId, userId } = JSON.parse(req.query.state || "{}");
        const email = profile.emails[0].value;
        const project = await ProjectController.getProjectById(projectId);
        const user = await UserController.getUserByEmail(email);
        if (!user || user.userId !== userId) {
          return done(null, false);
        }
        if (project.createBy !== user.userId) {
          return done(null, false);
        }
        const updateRow = await UserController.updateUser(user.userId, {
          refreshtoken: refreshToken,
        });
        if (!updateRow) {
          return done(null, false);
        }
        return done(null, { projectId, user });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((data, done) => done(null, data));
passport.deserializeUser((data, done) => done(null, data));
