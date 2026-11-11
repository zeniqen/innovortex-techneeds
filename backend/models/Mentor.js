const mongoose = require('mongoose');

const MentorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  programs: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Program' 
  }],
  title: { type: String, default: 'Mentor' },
  bio: { type: String, default: '' },
  skills: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Mentor', MentorSchema);