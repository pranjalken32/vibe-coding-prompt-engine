const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['open', 'in_progress', 'review', 'done'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String, trim: true }],
  dueDate: { type: Date },
  completedAt: { type: Date },
  isRecurring: { type: Boolean, default: false },
  recurrence: {
    type: String,
    enum: [null, 'daily', 'weekly', 'monthly'],
    default: null,
  },
  nextRecurrence: { type: Date },
}, { timestamps: true });

taskSchema.index({ orgId: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
