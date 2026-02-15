const cron = require('node-cron');
const Task = require('../models/Task');
const { logAudit } = require('./auditHelper');

const scheduleRecurringTasks = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running recurring task check...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recurringTasks = await Task.find({
      isRecurring: true,
      nextRecurrence: { $lte: today },
    });

    for (const task of recurringTasks) {
      // Create a new task instance
      const newTask = new Task({
        orgId: task.orgId,
        title: task.title,
        description: task.description,
        status: 'open',
        priority: task.priority,
        assigneeId: task.assigneeId,
        createdBy: task.createdBy,
        tags: task.tags,
        dueDate: null, // Or calculate next due date
      });

      await newTask.save();

      // Update the original task's next recurrence date
      const nextDate = new Date(task.nextRecurrence);
      if (task.recurrence === 'daily') {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (task.recurrence === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (task.recurrence === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      task.nextRecurrence = nextDate;
      await task.save();

      // Log the creation of the new recurring task
      await logAudit({
        orgId: newTask.orgId,
        userId: 'system', // Or a dedicated system user ID
        action: 'created_recurring',
        resource: 'task',
        resourceId: newTask._id,
        changes: { title: newTask.title, fromTask: task._id },
        ipAddress: 'system',
      });

      console.log(`Created recurring task: ${newTask.title}`);
    }
  });
};

module.exports = { scheduleRecurringTasks };
