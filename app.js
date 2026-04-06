const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const userRouter = require("./router/UserRouter");
const projectRouter = require("./router/ProjectRouter");
const attendRouter = require("./router/AttendRouter");
const workflowRouter = require("./router/WorkflowRouter");
const assignTaskRouter = require("./router/AssignTaskRouter");
const taskRouter = require("./router/TaskRouter");
const commentRouter = require("./router/CommentRouter");
const documentfilechecklistRouter = require("./router/DocumentFileChecklistRouter");
const reportProjectRouet = require("./router/ReportProjectRouter");
const reportWorkflowRouter = require("./router/ReportWorkflowRouter");
const reportTaskRouter = require("./router/ReportTaskRouter");
const roleRouter = require("./router/RoleRouter");
const permissionsRouter = require("./router/PermissionsRouter");
const roleProjectPermissiomRouter = require("./router/RoleProjectPermissionRouter");
const notificationAttend = require("./router/NotificationAttendRouter");
const googlesearchRouter = require("./router/GoogleSearchRouter");
const querysiteurlRouter = require("./router/QuerySiteUrlRouter");
const fieldRouter = require("./router/FieldRouter");
const toolRouter = require("./router/ToolRouter");
const toolFieldRouter = require("./router/ToolFieldRouter");
const attendToolRouter = require("./router/AttendToolRouter");
require("./corn/gsc.cron");
require("./corn/checkDate.corn");
require("./corn/autoDeleteUser.corn");
const passport = require("passport");
require("./middleware/auth20");
require("./middleware/authGCS");

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(passport.initialize());
app.use(bodyParser.json());

app.use("/user", userRouter);
app.use("/project", projectRouter);
app.use("/workflow", workflowRouter);
app.use("/members", attendRouter);
app.use("/task", taskRouter);
app.use("/assignTask", assignTaskRouter);
app.use("/commentTask", commentRouter);
app.use("/documentFileChecklist", documentfilechecklistRouter);
app.use("/reportProject", reportProjectRouet);
app.use("/reportWorkflow", reportWorkflowRouter);
app.use("/reportTask", reportTaskRouter);
app.use("/role", roleRouter);
app.use("/permissions", permissionsRouter);
app.use("/roleprojectpermission", roleProjectPermissiomRouter);
app.use(`/notification`, notificationAttend);
app.use("/google", googlesearchRouter);
app.use("/query", querysiteurlRouter);
app.use("/field", fieldRouter);
app.use("/tool", toolRouter);
app.use("/toolField", toolFieldRouter);
app.use("/attendTool", attendToolRouter);
app.use("/uploads", express.static("uploads"));

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
