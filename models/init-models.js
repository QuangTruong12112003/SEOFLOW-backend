var DataTypes = require("sequelize").DataTypes;
var _attend = require("./attend");
var _comments = require("./comments");
var _documentfilechecklist = require("./documentfilechecklist");
var _field = require("./field");
var _gscdailyoverview = require("./gscdailyoverview");
var _gscpage = require("./gscpage");
var _gscquery = require("./gscquery");
var _notification = require("./notification");
var _notificationattend = require("./notificationattend");
var _permissions = require("./permissions");
var _projects = require("./projects");
var _queryfollow = require("./queryfollow");
var _reports = require("./reports");
var _roleprojectpermission = require("./roleprojectpermission");
var _roles = require("./roles");
var _siteurl = require("./siteurl");
var _tasks = require("./tasks");
var _taskuser = require("./taskuser");
var _tool = require("./tool");
var _toolattend = require("./toolattend");
var _toolfield = require("./toolfield");
var _users = require("./users");
var _workflows = require("./workflows");

function initModels(sequelize) {
  var attend = _attend(sequelize, DataTypes);
  var comments = _comments(sequelize, DataTypes);
  var documentfilechecklist = _documentfilechecklist(sequelize, DataTypes);
  var field = _field(sequelize, DataTypes);
  var gscdailyoverview = _gscdailyoverview(sequelize, DataTypes);
  var gscpage = _gscpage(sequelize, DataTypes);
  var gscquery = _gscquery(sequelize, DataTypes);
  var notification = _notification(sequelize, DataTypes);
  var notificationattend = _notificationattend(sequelize, DataTypes);
  var permissions = _permissions(sequelize, DataTypes);
  var projects = _projects(sequelize, DataTypes);
  var queryfollow = _queryfollow(sequelize, DataTypes);
  var reports = _reports(sequelize, DataTypes);
  var roleprojectpermission = _roleprojectpermission(sequelize, DataTypes);
  var roles = _roles(sequelize, DataTypes);
  var siteurl = _siteurl(sequelize, DataTypes);
  var tasks = _tasks(sequelize, DataTypes);
  var taskuser = _taskuser(sequelize, DataTypes);
  var tool = _tool(sequelize, DataTypes);
  var toolattend = _toolattend(sequelize, DataTypes);
  var toolfield = _toolfield(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);
  var workflows = _workflows(sequelize, DataTypes);

  attend.belongsToMany(notification, { as: 'notificationId_notifications', through: notificationattend, foreignKey: "attendId", otherKey: "notificationId" });
  attend.belongsToMany(tasks, { as: 'taskId_tasks', through: taskuser, foreignKey: "attendId", otherKey: "taskId" });
  attend.belongsToMany(tool, { as: 'toolId_tools', through: toolattend, foreignKey: "attendId", otherKey: "toolId" });
  notification.belongsToMany(attend, { as: 'attendId_attends', through: notificationattend, foreignKey: "notificationId", otherKey: "attendId" });
  tasks.belongsToMany(attend, { as: 'attendId_attend_taskusers', through: taskuser, foreignKey: "taskId", otherKey: "attendId" });
  tool.belongsToMany(attend, { as: 'attendId_attend_toolattends', through: toolattend, foreignKey: "toolId", otherKey: "attendId" });
  comments.belongsTo(attend, { as: "createBy_attend", foreignKey: "createBy"});
  attend.hasMany(comments, { as: "comments", foreignKey: "createBy"});
  documentfilechecklist.belongsTo(attend, { as: "createBy_attend", foreignKey: "createBy"});
  attend.hasMany(documentfilechecklist, { as: "documentfilechecklists", foreignKey: "createBy"});
  notification.belongsTo(attend, { as: "createBy_attend", foreignKey: "createBy"});
  attend.hasMany(notification, { as: "notifications", foreignKey: "createBy"});
  notificationattend.belongsTo(attend, { as: "attend", foreignKey: "attendId"});
  attend.hasMany(notificationattend, { as: "notificationattends", foreignKey: "attendId"});
  reports.belongsTo(attend, { as: "createBy_attend", foreignKey: "createBy"});
  attend.hasMany(reports, { as: "reports", foreignKey: "createBy"});
  tasks.belongsTo(attend, { as: "createBy_attend", foreignKey: "createBy"});
  attend.hasMany(tasks, { as: "tasks", foreignKey: "createBy"});
  taskuser.belongsTo(attend, { as: "attend", foreignKey: "attendId"});
  attend.hasMany(taskuser, { as: "taskusers", foreignKey: "attendId"});
  toolattend.belongsTo(attend, { as: "attend", foreignKey: "attendId"});
  attend.hasMany(toolattend, { as: "toolattends", foreignKey: "attendId"});
  toolfield.belongsTo(field, { as: "field", foreignKey: "fieldId"});
  field.hasMany(toolfield, { as: "toolfields", foreignKey: "fieldId"});
  notificationattend.belongsTo(notification, { as: "notification", foreignKey: "notificationId"});
  notification.hasMany(notificationattend, { as: "notificationattends", foreignKey: "notificationId"});
  roleprojectpermission.belongsTo(permissions, { as: "permission", foreignKey: "permissionId"});
  permissions.hasMany(roleprojectpermission, { as: "roleprojectpermissions", foreignKey: "permissionId"});
  attend.belongsTo(projects, { as: "project", foreignKey: "projectId"});
  projects.hasMany(attend, { as: "attends", foreignKey: "projectId"});
  notification.belongsTo(projects, { as: "project", foreignKey: "projectId"});
  projects.hasMany(notification, { as: "notifications", foreignKey: "projectId"});
  reports.belongsTo(projects, { as: "project", foreignKey: "projectId"});
  projects.hasMany(reports, { as: "reports", foreignKey: "projectId"});
  roleprojectpermission.belongsTo(projects, { as: "project", foreignKey: "projectId"});
  projects.hasMany(roleprojectpermission, { as: "roleprojectpermissions", foreignKey: "projectId"});
  siteurl.belongsTo(projects, { as: "project", foreignKey: "projectId"});
  projects.hasMany(siteurl, { as: "siteurls", foreignKey: "projectId"});
  tool.belongsTo(projects, { as: "project", foreignKey: "projectId"});
  projects.hasMany(tool, { as: "tools", foreignKey: "projectId"});
  workflows.belongsTo(projects, { as: "project", foreignKey: "projectId"});
  projects.hasMany(workflows, { as: "workflows", foreignKey: "projectId"});
  attend.belongsTo(roles, { as: "role", foreignKey: "roleId"});
  roles.hasMany(attend, { as: "attends", foreignKey: "roleId"});
  roleprojectpermission.belongsTo(roles, { as: "role", foreignKey: "roleId"});
  roles.hasMany(roleprojectpermission, { as: "roleprojectpermissions", foreignKey: "roleId"});
  gscdailyoverview.belongsTo(siteurl, { as: "site", foreignKey: "siteId"});
  siteurl.hasMany(gscdailyoverview, { as: "gscdailyoverviews", foreignKey: "siteId"});
  gscpage.belongsTo(siteurl, { as: "site", foreignKey: "siteId"});
  siteurl.hasMany(gscpage, { as: "gscpages", foreignKey: "siteId"});
  gscquery.belongsTo(siteurl, { as: "site", foreignKey: "siteId"});
  siteurl.hasMany(gscquery, { as: "gscqueries", foreignKey: "siteId"});
  queryfollow.belongsTo(siteurl, { as: "site", foreignKey: "siteId"});
  siteurl.hasMany(queryfollow, { as: "queryfollows", foreignKey: "siteId"});
  comments.belongsTo(tasks, { as: "task", foreignKey: "taskId"});
  tasks.hasMany(comments, { as: "comments", foreignKey: "taskId"});
  documentfilechecklist.belongsTo(tasks, { as: "task", foreignKey: "taskId"});
  tasks.hasMany(documentfilechecklist, { as: "documentfilechecklists", foreignKey: "taskId"});
  reports.belongsTo(tasks, { as: "task", foreignKey: "taskId"});
  tasks.hasMany(reports, { as: "reports", foreignKey: "taskId"});
  taskuser.belongsTo(tasks, { as: "task", foreignKey: "taskId"});
  tasks.hasMany(taskuser, { as: "taskusers", foreignKey: "taskId"});
  toolattend.belongsTo(tool, { as: "tool", foreignKey: "toolId"});
  tool.hasMany(toolattend, { as: "toolattends", foreignKey: "toolId"});
  toolfield.belongsTo(tool, { as: "tool", foreignKey: "toolId"});
  tool.hasMany(toolfield, { as: "toolfields", foreignKey: "toolId"});
  attend.belongsTo(users, { as: "user", foreignKey: "userId"});
  users.hasMany(attend, { as: "attends", foreignKey: "userId"});
  projects.belongsTo(users, { as: "createBy_user", foreignKey: "createBy"});
  users.hasMany(projects, { as: "projects", foreignKey: "createBy"});
  reports.belongsTo(workflows, { as: "workflow", foreignKey: "workflowId"});
  workflows.hasMany(reports, { as: "reports", foreignKey: "workflowId"});
  tasks.belongsTo(workflows, { as: "workflow", foreignKey: "workflowId"});
  workflows.hasMany(tasks, { as: "tasks", foreignKey: "workflowId"});

  return {
    attend,
    comments,
    documentfilechecklist,
    field,
    gscdailyoverview,
    gscpage,
    gscquery,
    notification,
    notificationattend,
    permissions,
    projects,
    queryfollow,
    reports,
    roleprojectpermission,
    roles,
    siteurl,
    tasks,
    taskuser,
    tool,
    toolattend,
    toolfield,
    users,
    workflows,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
