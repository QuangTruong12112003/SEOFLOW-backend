const { where } = require("sequelize");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const models = initModels(sequelize);
class TaskStatusTriggerServices {
  static async onTaskChanged(taskId) {
    const task = await models.tasks.findByPk(taskId, {
      include: [
        {
          model: models.workflows,
          as: "workflow",
        },
      ],
    });
    if (!task) return;
    const workflowId = task.workflowId;
    const projectId = task.workflow?.projectId;

    const tasks = await models.tasks.findAll({
      where: { workflowId },
    });
    const allTasksDone = tasks.every((t) => t.status === "Hoàn thành");
    const anyDoing = tasks.some((t) => t.status === "Đang thực hiện");
    const allNotStart = tasks.every((t) => t.status === "Chưa bắt đầu");

    if (allTasksDone) {
      await models.workflows.update(
        { status: "Hoàn thành" },
        {
          where: { workflowId },
        }
      );
    } else if (anyDoing) {
      await models.workflows.update(
        { status: "Đang thực hiện" },
        {
          where: { workflowId },
        }
      );
    } else if (allNotStart) {
      await models.workflows.update(
        { status: "Chưa bắt đầu" },
        {
          where: { workflowId },
        }
      );
    } else {
      await models.workflows.update(
        { status: "Đang thực hiện" },
        {
          where: { workflowId },
        }
      );
    }

    const workflows = await models.workflows.findAll({
      where: { projectId },
    });
    const allWorkflowDone = workflows.every((w) => w.status === "Hoàn thành");
    const anyWorkflowDoing = workflows.some(
      (w) => w.status === "Đang thực hiện"
    );
    const allWorkflowNotDone = workflows.every(
      (w) => w.status === "Chưa bắt đầu"
    );
    if (allWorkflowDone) {
      await models.projects.update(
        { status: "Hoàn thành" },
        {
          where: { projectId },
        }
      );
    } else if (anyWorkflowDoing) {
      await models.projects.update(
        { status: "Đang thực hiện" },
        {
          where: { projectId },
        }
      );
    } else if (allWorkflowNotDone) {
      await models.projects.update(
        { status: "Chưa bắt đầu" },
        {
          where: { projectId },
        }
      );
    } else {
      await models.projects.update(
        { status: "Đang thực hiện" },
        {
          where: { projectId },
        }
      );
    }
    const countTaskByWorkflowCompleted = await models.tasks.count({
      where: {
        status: "Hoàn thành",
        workflowId: workflowId,
      },
    });
    const countAllTaskByWorkflow = await models.tasks.count({
      where: {
        workflowId,
      },
    });
    const progressWorkflow =
      (countTaskByWorkflowCompleted * 100) / countAllTaskByWorkflow;
    await models.workflows.update(
      { progress: parseFloat(progressWorkflow).toFixed(2) },
      {
        where: { workflowId },
      }
    );

    const countWorkflowByProjectCompleted = await models.workflows.count({
      where: {
        status: "Hoàn thành",
        projectId: projectId,
      },
    });
    const countWorkflowProject = await models.workflows.count({
      where: {
        projectId,
      },
    });

    const progressProject =
      (countWorkflowByProjectCompleted * 100) / countWorkflowProject;
    await models.projects.update(
      { progress: parseFloat(progressProject.toFixed(2)) },
      { where: { projectId } }
    );
  }

  static async onDeleteTask(workflowId) {
    try {
      const workflow = await models.workflows.findByPk(workflowId);
      if (!workflow) return;
      const projectId = workflow.projectId;
      const tasks =  await models.tasks.findAll({
        where: {
          workflowId: workflow.workflowId,
        },
      });

      const allTasksDone = tasks.every((t) => t.status === "Hoàn thành");
      const anyDoing = tasks.some((t) => t.status === "Đang thực hiện");
      const allNotStart = tasks.every((t) => t.status === "Chưa bắt đầu");

      if (allTasksDone) {
        await models.workflows.update(
          { status: "Hoàn thành" },
          {
            where: {
              workflowId: workflow.workflowId,
            },
          }
        );
      } else if (anyDoing) {
        await models.workflows.update(
          { status: "Đang thực hiện" },
          {
            where: {
              workflowId: workflow.workflowId,
            },
          }
        );
      } else if (allNotStart) {
        await models.workflows.update(
          { status: "Chưa bắt đầu" },
          {
            where: { workflowId: workflow.workflowId },
          }
        );
      } else {
        await models.workflows.update(
          { status: "Đang thực hiện" },
          {
            where: { workflowId: workflow.workflowId },
          }
        );
      }

      const workflows = await models.workflows.findAll({
        where: { projectId },
      });

      const allWorkflowDone = workflows.every((t) => t.status === "Hoàn thành");
      const anyWorkflowDoing = workflows.some(
        (t) => t.status === "Đang thực hiện"
      );
      const allNotWorkflowStart = workflows.every(
        (t) => t.status === "Chưa bắt đầu"
      );

      if (allWorkflowDone) {
        await models.projects.update(
          { status: "Hoàn thành" },
          { where: { projectId } }
        );
      } else if (anyWorkflowDoing) {
        await models.projects.update(
          { status: "Đang thực hiện" },
          { where: { projectId } }
        );
      } else if (allNotWorkflowStart) {
        await models.projects.update(
          { status: "Chưa bắt đầu" },
          { where: { projectId } }
        );
      } else {
        await models.projects.update(
          { status: "Đang thực hiện" },
          { where: { projectId } }
        );
      }
      const countTaskByWorkflowCompleted = await models.tasks.count({
        where: {
          status: "Hoàn thành",
          workflowId: workflowId,
        },
      });
      const countAllTaskByWorkflow = await models.tasks.count({
        where: {
          workflowId,
        },
      });
      const progressWorkflow =
        (countTaskByWorkflowCompleted * 100) / countAllTaskByWorkflow;
      await models.workflows.update(
        { progress: parseFloat(progressWorkflow.toFixed(2)) },
        {
          where: { workflowId },
        }
      );

      const countWorkflowByProjectCompleted = await models.workflows.count({
        where: {
          status: "Hoàn thành",
          projectId: projectId,
        },
      });
      const countWorkflowProject = await models.workflows.count({
        where: {
          projectId,
        },
      });

      const progressProject =
        (countWorkflowByProjectCompleted * 100) / countWorkflowProject;
      await models.projects.update(
        { progress: parseFloat(progressProject.toFixed(2)) },
        { where: { projectId } }
      );
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = TaskStatusTriggerServices;
