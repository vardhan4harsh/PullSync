const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  gitUrl: {
    type: String,
    required: true
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['read', 'write', 'admin'],
      default: 'read'
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Repository', repositorySchema);
