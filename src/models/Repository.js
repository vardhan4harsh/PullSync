const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Repository name is required'],
      trim: true,
      maxlength: [100, 'Repository name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    gitPath: {
      type: String,
      required: [true, 'Git repository path is required']
    },
    defaultBranch: {
      type: String,
      default: 'main'
    },
    isPrivate: {
      type: Boolean,
      default: true
    },
    settings: {
      requireApprovals: {
        type: Number,
        default: 1,
        min: 0
      },
      allowSelfApproval: {
        type: Boolean,
        default: false
      }
    },
    stats: {
      totalPRs: {
        type: Number,
        default: 0
      },
      openPRs: {
        type: Number,
        default: 0
      },
      mergedPRs: {
        type: Number,
        default: 0
      }
    },
    collaborators: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['admin', 'write', 'read'],
        default: 'read'
      }
    }]
  },
  {
    timestamps: true
  }
);

// Index for faster queries
repositorySchema.index({ owner: 1 });
repositorySchema.index({ name: 1, owner: 1 });

module.exports = mongoose.model('Repository', repositorySchema);
