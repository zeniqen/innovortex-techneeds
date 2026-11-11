const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Mentor = require('../models/Mentor');
const Program = require('../models/Program');
const Resource = require('../models/Resource');
const Mentee = require('../models/Mentee');
const Quiz = require('../models/Quiz');
const { authenticate, requireAdmin } = require('../middleware/authMentor');
const router = express.Router();

// --- helpers ---------------------------------------------------------------

/**
 * A mentor without its password hash.
 *
 * The mentor documents are embedded in a program, so every program in the
 * list carried the hash of everyone on it.
 */
function withoutPassword(mentor) {
  if (!mentor) return mentor;
  const plain = mentor.toObject ? mentor.toObject() : { ...mentor };
  delete plain.password;
  return plain;
}

function withoutPasswords(mentors) {
  return (mentors || []).map(withoutPassword);
}

// --- mentors ---------------------------------------------------------------

// Create Mentor
router.post('/mentors', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const existing = await Mentor.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'That email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const mentor = new Mentor({
      name,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, salt)
    });
    await mentor.save();

    res.status(201).json(withoutPassword(mentor));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all mentors
router.get('/mentors', async (req, res) => {
  try {
    const mentors = await Mentor.find().populate('programs');
    res.json(withoutPasswords(mentors));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one mentor
router.get('/mentors/:id', async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id).populate('programs');
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });
    res.json(withoutPassword(mentor));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a mentor
router.patch('/mentors/:id', async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    const { name, title, bio, skills } = req.body || {};
    if (name) mentor.name = name;
    if (title !== undefined) mentor.title = title;
    if (bio !== undefined) mentor.bio = bio;
    if (skills !== undefined) mentor.skills = skills;

    await mentor.save();
    res.json(withoutPassword(mentor));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a mentor
//
// The mentees stay: a mentee belongs to a program, not to the person who
// happened to be looking after it.
router.delete('/mentors/:id', requireAdmin, async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    await Program.updateMany(
      { mentors: mentor._id },
      { $pull: { mentors: mentor._id } }
    );
    await mentor.deleteOne();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mentor Login
router.post('/mentors/login', async (req, res) => {
  const { email, password } = req.body || {};
  try {
    const mentor = await Mentor.findOne({ email: String(email || '').toLowerCase() });
    if (!mentor || !(await bcrypt.compare(password || '', mentor.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: mentor._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, mentor: withoutPassword(mentor) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- programs --------------------------------------------------------------

// Get all programs
router.get('/programs', async (req, res) => {
  try {
    const programs = await Program.find().populate('mentors');
    res.json(
      programs.map((program) => {
        const plain = program.toObject();
        plain.mentors = withoutPasswords(plain.mentors);
        return plain;
      })
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one program
router.get('/programs/:id', async (req, res) => {
  try {
    const program = await Program.findById(req.params.id).populate('mentors');
    if (!program) return res.status(404).json({ error: 'Program not found' });
    const plain = program.toObject();
    plain.mentors = withoutPasswords(plain.mentors);
    res.json(plain);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Program (Assign to Mentor)
router.post('/programs', async (req, res) => {
  try {
    const { name, description, track } = req.body || {};
    if (!name) return res.status(400).json({ error: 'A program needs a name' });

    const program = new Program({
      name,
      description: description || '',
      track: track || 'general'
    });
    await program.save();

    res.status(201).json(program);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a program
router.patch('/programs/:id', async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found' });

    const { name, description, track, status } = req.body || {};
    if (name) program.name = name;
    if (description !== undefined) program.description = description;
    if (track !== undefined) program.track = track;
    if (status !== undefined) program.status = status;

    await program.save();
    res.json(program);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a program, and everything on it
router.delete('/programs/:id', requireAdmin, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found' });

    const resources = await Resource.find({ program: program._id });
    const resourceIds = resources.map((resource) => resource._id);

    await Mentee.updateMany(
      { programs: program._id },
      { $pull: { programs: program._id } }
    );
    await Mentee.updateMany(
      { 'completedResources.resource': { $in: resourceIds } },
      { $pull: { completedResources: { resource: { $in: resourceIds } } } }
    );
    await Resource.deleteMany({ program: program._id });
    await Mentor.updateMany(
      { programs: program._id },
      { $pull: { programs: program._id } }
    );
    await program.deleteOne();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Mentor to Program (Manual via Thunder Client)
router.post('/programs/:programId/add-mentor', async (req, res) => {
  try {
    const program = await Program.findById(req.params.programId);
    const mentor = await Mentor.findById(req.body?.mentorId);

    if (!program || !mentor) {
      return res.status(404).json({ error: 'Program/Mentor not found' });
    }

    if (!program.mentors.includes(mentor._id)) {
      program.mentors.push(mentor._id);
    }
    if (!mentor.programs.includes(program._id)) {
      mentor.programs.push(program._id);
    }

    await program.save();
    await mentor.save();

    res.json({ program, mentor: withoutPassword(mentor) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Take a mentor off a program
router.delete('/programs/:programId/mentors/:mentorId', async (req, res) => {
  try {
    const program = await Program.findById(req.params.programId);
    const mentor = await Mentor.findById(req.params.mentorId);

    if (!program || !mentor) {
      return res.status(404).json({ error: 'Program/Mentor not found' });
    }

    program.mentors.pull(mentor._id);
    mentor.programs.pull(program._id);
    await program.save();
    await mentor.save();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- resources -------------------------------------------------------------

// Add Resource (Only for assigned programs)
router.post('/resources', authenticate, async (req, res) => {
  try {
    const program = await Program.findById(req.body?.program);
    if (!program) return res.status(404).json({ error: 'Program not found' });
    if (!program.mentors.includes(req.mentor._id)) {
      return res.status(403).json({ error: 'Not authorized for this program' });
    }

    const { title, type, url, maxScore, deadline, description, tags } = req.body || {};
    if (!title) return res.status(400).json({ error: 'A resource needs a title' });

    const resource = new Resource({
      title,
      type: type || 'video',
      url: url || '',
      description: description || '',
      tags: tags || [],
      maxScore: maxScore || 300,
      deadline: deadline || undefined,
      program: program._id,
      addedBy: req.mentor._id
    });

    await resource.save();

    if (!program.resources.includes(resource._id)) {
      program.resources.push(resource._id);
      await program.save();
    }

    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resources/quiz', authenticate, async (req, res) => {
  try {
    const { title, program, questions, startTime, endTime, maxScore } = req.body || {};

    const programDoc = await Program.findById(program);
    if (!programDoc) return res.status(404).json({ error: 'Program not found' });
    if (!programDoc.mentors.includes(req.mentor._id)) {
      return res.status(403).json({ error: 'Not authorized for this program' });
    }

    // Step 1: Create the Resource with type 'quiz'
    const resource = new Resource({
      title,
      type: 'quiz',
      program,
      maxScore,
      isLocked: true,
      addedBy: req.mentor._id,
      deadline: endTime
    });

    await resource.save();

    const quiz = new Quiz({
      resource: resource._id,
      questions,
      startTime,
      endTime
    });

    await quiz.save();

    programDoc.resources.push(resource._id);
    await programDoc.save();

    res.status(201).json({ message: 'Quiz resource created', resource, quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get one resource
router.get('/resources/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a resource
router.patch('/resources/:id', authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    const program = await Program.findById(resource.program);
    if (!program || !program.mentors.includes(req.mentor._id)) {
      return res.status(403).json({ error: 'Not authorized for this resource' });
    }

    const { title, description, type, url, maxScore, deadline, tags } = req.body || {};
    if (title) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (type) resource.type = type;
    if (url !== undefined) resource.url = url;
    if (maxScore !== undefined) resource.maxScore = maxScore;
    if (deadline !== undefined) resource.deadline = deadline || null;
    if (tags !== undefined) resource.tags = tags;

    await resource.save();
    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a resource
router.delete('/resources/:id', requireAdmin, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    await Program.updateMany(
      { resources: resource._id },
      { $pull: { resources: resource._id } }
    );
    await Mentee.updateMany(
      { 'completedResources.resource': resource._id },
      { $pull: { completedResources: { resource: resource._id } } }
    );
    await resource.deleteOne();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- mentees ---------------------------------------------------------------

// Mentor adds a mentee (with auto-generated credentials)
router.post('/mentees', authenticate, async (req, res) => {
  try {
    const { email, name, enrollmentNumber, programId, interests } = req.body || {};
    const mentor = req.mentor;

    if (!name || !email || !enrollmentNumber || !programId) {
      return res.status(400).json({
        error: 'Name, email, enrollment number and program are required'
      });
    }

    // Check if mentor is assigned to the program
    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ error: 'Program not found' });
    if (!program.mentors.includes(mentor._id)) {
      return res.status(403).json({ error: 'Not authorized for this program' });
    }

    const taken = await Mentee.findOne({ enrollmentNumber });
    if (taken) {
      return res.status(409).json({ error: 'That enrollment number is already in use' });
    }

    // Generate a random password (or let mentor set one)
    const tempPassword = Math.random().toString(36).slice(-8); // Example: "x7f9d2y"

    const mentee = new Mentee({
      email,
      name,
      enrollmentNumber,
      // Hashed, so it cannot be read back out of the database.
      password: await bcrypt.hash(tempPassword, 10),
      interests: interests || [],
      programs: [programId]
    });
    await mentee.save();

    // Optional: Send email to mentee with credentials
    // await sendWelcomeEmail(mentee.email, enrollmentNumber, tempPassword);

    res.status(201).json({
      mentee: withoutPassword(mentee),
      tempPassword // Mentor sees this (for manual sharing)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all mentees for a program
router.get('/:programId/mentees', async (req, res) => {
  try {
    const mentees = await Mentee.find({ programs: req.params.programId })
      .populate('completedResources.resource', 'title type');

    res.json(withoutPasswords(mentees));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:programId/resources', async (req, res) => {
  try {
    const resources = await Resource.find({ program: req.params.programId })
      .sort({ createdAt: -1 }); // Newest first

    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Every mentee a mentor looks after
router.get('/mentors/:id/mentees', async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id).populate('programs');
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    const programIds = (mentor.programs || []).map((program) => program._id);
    const mentees = await Mentee.find({ programs: { $in: programIds } });

    res.json(withoutPasswords(mentees));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Every resource a mentor has published
router.get('/mentors/:id/resources', async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id).populate('programs');
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    const programIds = (mentor.programs || []).map((program) => program._id);
    const resources = await Resource.find({ program: { $in: programIds } })
      .sort({ createdAt: -1 });

    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- marking ---------------------------------------------------------------

// PATCH /api/mentees/:menteeId/resources/:resourceId/verify
router.patch('/:menteeId/resources/:resourceId/verify', authenticate, async (req, res) => {
  try {
    const { menteeId, resourceId } = req.params;
    const { score } = req.body || {};

    const resource = await Resource.findById(resourceId);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    const program = await Program.findById(resource.program);
    if (!program || !program.mentors.includes(req.mentor._id)) {
      return res.status(403).json({ error: 'Not authorized for this resource' });
    }

    if (resource.type !== 'project') {
      return res.status(400).json({ error: 'Only project-type resources can be verified' });
    }

    if (resource.isLocked) {
      return res.status(403).json({ error: 'Resource is currently locked' });
    }

    const mentee = await Mentee.findById(menteeId);
    if (!mentee) return res.status(404).json({ error: 'Mentee not found' });

    const submission = mentee.completedResources.find(
      (entry) => entry.resource.toString() === resourceId
    );

    if (!submission) {
      return res.status(400).json({ error: 'Project not yet submitted by this mentee' });
    }

    if (submission.verified) {
      return res.status(400).json({ error: 'This project has already been verified' });
    }

    const finalScore = Math.min(score, resource.maxScore);
    submission.score = finalScore;
    submission.verified = true;

    mentee.totalScore += finalScore;
    await mentee.save();

    res.json({ message: 'Project verified and scored', finalScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/unverified-projects', authenticate, async (req, res) => {
  try {
    const mentor = req.mentor;

    // Find mentees having any completed resource which is a project & unverified
    const mentees = await Mentee.find({
      'completedResources.verified': false
    }).populate({
      path: 'completedResources.resource',
      populate: { path: 'program' }
    });

    const unverifiedProjects = [];
    mentees.forEach(mentee => {
      mentee.completedResources.forEach(resourceEntry => {
        const resObj = resourceEntry.resource;
        if (
          resObj &&
          resObj.type === 'project' &&
          resourceEntry.verified === false &&
          mentor.programs.map(p => p.toString()).includes(resObj.program._id.toString())
        ) {
          unverifiedProjects.push({
            menteeId: mentee._id,
            menteeName: mentee.name,
            resourceId: resObj._id,
            resourceTitle: resObj.title,
            githubLink: resourceEntry.githubLink,
            deployedLink: resourceEntry.deployedLink,
            description: resourceEntry.description,
            submittedOn: resourceEntry.submittedOn
          });
        }
      });
    });

    res.json({ unverifiedProjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
