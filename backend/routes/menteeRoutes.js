const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Mentee = require('../models/Mentee');
const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const Program = require('../models/Program');
const Resource = require('../models/Resource');
const { authenticateAny, authenticateMentee } = require('../middleware/authMentor');
const router = express.Router();


router.post('/login', async (req, res) => {
  const { enrollmentNumber, password } = req.body || {};
  try {
    const mentee = await Mentee.findOne({ enrollmentNumber });

    if (!mentee) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Mentees created through the mentor flow store a bcrypt hash. The
    // ones seeded before that change still hold the password in the clear,
    // so both are accepted, and a password that was in the clear is
    // hashed the first time it is used.
    const stored = String(mentee.password || '');
    const matches = stored.startsWith('$2')
      ? await bcrypt.compare(String(password || ''), stored)
      : stored === String(password || '');

    if (!matches) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!stored.startsWith('$2')) {
      mentee.password = await bcrypt.hash(String(password), 10);
      await mentee.save();
    }

    const token = jwt.sign({ id: mentee._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: mentee._id,
        name: mentee.name,
        enrollmentNumber: mentee.enrollmentNumber
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Mentee Dashboard --- //
router.get('/dashboard', authenticateMentee, async (req, res) => {
  try {
    const mentee = await Mentee.findById(req.mentee._id)
    .populate({
      path: 'programs',
      populate: {
        path: 'resources',
        model: 'Resource'
      }
    })  
    .populate({
      path: 'completedResources.resource',
      model: 'Resource'
    });
    // Map completedResources for quick lookup
    const completedMap = new Map();
    mentee.completedResources.forEach((item) => {
      completedMap.set(item.resource._id.toString(), {
        score: item.score,
        completedOn: item.completedOn
      });
    });

    let totalScore = 0;
mentee.completedResources.forEach((item) => {
  totalScore += item.score || 0;
});

    // Add completed status to each resource
    const updatedPrograms = mentee.programs.map((program) => {
      const updatedResources = program.resources.map((res) => {
        const isCompleted = completedMap.has(res._id.toString());
        return {
          ...res.toObject(),
          completed: isCompleted,
          score: isCompleted ? completedMap.get(res._id.toString()).score : null,
          completedOn: isCompleted ? completedMap.get(res._id.toString()).completedOn : null
        };
      });
      return {
        ...program.toObject(),
        resources: updatedResources
      };
    });
    res.json({
      name: mentee.name,
      enrollmentNumber: mentee.enrollmentNumber,
      interests: mentee.interests || [],
      programs: mentee.programs,
      streak: mentee.streak,
      totalScore,
      programs: updatedPrograms,
      rank: await calculateRank(mentee._id), // Implement this helper
    //   resources: await getResourcesWithStatus(mentee) // Implement this
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- One mentee, for the profile page --- //
router.get('/mentee/:id', authenticateAny, async (req, res) => {
  try {
    const mentee = await Mentee.findById(req.params.id)
      .populate({
        path: 'programs',
        populate: { path: 'resources', model: 'Resource' }
      })
      .populate({
        path: 'completedResources.resource',
        model: 'Resource'
      });

    if (!mentee) return res.status(404).json({ error: 'Mentee not found' });

    const plain = mentee.toObject();
    delete plain.password;

    res.json(plain);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Resource Completion --- //
router.post('/resources/:id/complete', authenticateMentee, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    const mentee = req.mentee;

    // Check if resource is unlocked
    if (resource.isLocked) {
      return res.status(403).json({ error: 'Resource is locked' });
    }

    // Calculate score (deduct for late submission)
    const deadline = resource.deadline;
    const isLate = deadline && new Date() > deadline;
    const latePenalty = isLate ? Math.floor((new Date() - deadline) / (1000 * 60 * 60 * 24)) : 0; // 1 point/day
    const score = Math.max(0, resource.maxScore - latePenalty);

    // Update mentee's progress
    const completedResource = {
      resource: resource._id,
      score,
      completedOn: new Date()
    };

    // Check if resource is already completed
    const existingCompletion = mentee.completedResources.find(
      (completed) => completed.resource.toString() === resource._id.toString()
    );

    if (existingCompletion) {
      // If already completed, update the score and date
      existingCompletion.score = score;
      existingCompletion.completedOn = new Date();
    } else {
      // If not completed yet, push new completion entry
      mentee.completedResources.push(completedResource);
    }

    // Update streak (if active today)
    await updateStreak(mentee);
    await mentee.save();

    res.json({ message: 'Resource marked as completed!', score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resources/:id/quiz/submit', authenticateMentee, async (req, res) => {
  try {
    const resourceId = req.params.id;
    const mentee = req.mentee;
    const answers = req.body.answers; // [{ questionId, selectedOptionIndex }, ...]

    const resource = await Resource.findById(resourceId).populate('quiz');
    if (!resource || resource.type !== 'quiz') {
      return res.status(400).json({ error: 'Invalid quiz resource' });
    }

    if (resource.isLocked) {
      return res.status(403).json({ error: 'Quiz is locked' });
    }

    const quiz = await Quiz.findOne({resource:resourceId});
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const now = new Date();
    if (now < quiz.startTime || now > quiz.endTime) {
      return res.status(403).json({ error: 'Quiz is not active at this time' });
    }

    // Prevent resubmission
    const existing = await QuizSubmission.findOne({ quiz: quiz._id, mentee: mentee._id });
    if (existing) {
      return res.status(409).json({ error: 'Quiz already submitted' });
    }

    // Calculate score
    let totalScore = 0;
    for (const question of quiz.questions) {
      const userAnswer = answers.find(ans => ans.questionId === question._id.toString());
      if (userAnswer && userAnswer.selectedOptionIndex === question.correctOptionIndex) {
        totalScore += question.marks || 1;
      }
    }

    // Save submission
    const submission = new QuizSubmission({
      quiz: quiz._id,
      resource: resourceId,
      mentee: mentee._id,
      answers,
      score: totalScore,
    });

    await submission.save();

    // Update mentee's resource progress
    const completedResource = {
      resource: resource._id,
      score: totalScore,
      completedOn: new Date()
    };

    const alreadyCompleted = mentee.completedResources.find(
      (r) => r.resource.toString() === resource._id.toString()
    );

    if (alreadyCompleted) {
      alreadyCompleted.score = totalScore;
      alreadyCompleted.completedOn = new Date();
    } else {
      mentee.completedResources.push(completedResource);
    }

    // Update streak and total score
    await updateStreak(mentee);
    // mentee.totalScore += totalScore;
    await mentee.save();

    res.status(200).json({ message: 'Quiz submitted successfully!', score: totalScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/resources/:id/quiz', authenticateMentee, async (req, res) => {
  try {
    const resourceId = req.params.id;
    console.log(resourceId);
    const resource = await Resource.findById(resourceId).populate('quiz');
    if (!resource || resource.type !== 'quiz') {
      return res.status(400).json({ error: 'Invalid resource or quiz not found' });
    }

    console.log(resource);
    const quiz = await Quiz.findOne({ resource: resourceId });
    console.log("quiz",quiz);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({
      title: resource.title,
      description: resource.description,
      questions: quiz.questions.map((q) => ({
        id: q._id,
        questionText: q.questionText,
        options: q.options,
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/m/resources/:resourceId/project
router.post('/resources/:resourceId/project', authenticateMentee, async (req, res) => {
  try {
    const { githubLink, deployedLink, description } = req.body;
    const resource = await Resource.findById(req.params.resourceId);
    const mentee = req.mentee;

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (resource.type !== 'project') {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    if (resource.isLocked) {
      return res.status(403).json({ error: 'Resource is locked' });
    }
    // Validate inputs
    if (!githubLink || !deployedLink || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // if (description.trim().split(/\s+/).length < 300) {
    //   return res.status(400).json({ error: 'Description must be at least 300 words' });
    // }

    const deadline = resource.deadline;
    const isLate = deadline && new Date() > deadline;
    const latePenalty = isLate ? Math.floor((new Date() - deadline) / (1000 * 60 * 60 * 24)) : 0;
    const baseScore = resource.maxScore;
    const score = Math.max(0, baseScore - latePenalty);

    // Create the completion entry
    const projectCompletion = {
      resource: resource._id,
      githubLink,
      deployedLink,
      description,
      score: 0, // Score to be updated by mentor later
      submittedOn: new Date(),
    };

    // Check if already completed
    const existing = mentee.completedResources.find(
      (c) => c.resource.toString() === resource._id.toString()
    );

    if (existing) {
      existing.githubLink = githubLink;
      existing.deployedLink = deployedLink;
      existing.description = description;
      existing.submittedOn = new Date();
      existing.score = 0;
    } else {
      mentee.completedResources.push(projectCompletion);
    }
    await mentee.save();

    res.json({ message: 'Project submitted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Helper: Calculate rank (example: based on total score)
async function calculateRank(menteeId) {
  const me = await Mentee.findById(menteeId)
    .select('streak lastActiveDate completedResources.score')
    .lean();

  if (!me) return null;

  const myScore = (me.completedResources || [])
    .reduce((s, c) => s + (c?.score || 0), 0);
  const myStreak = me.streak || 0;
  const myLast   = me.lastActiveDate || new Date(0);

  // Count how many are strictly "better" in the same sort order
  const better = await Mentee.aggregate([
    {
      $project: {
        streak: { $ifNull: ['$streak', 0] },
        lastActiveDate: 1,
        totalScore: {
          $sum: {
            $map: {
              input: { $ifNull: ['$completedResources', []] },
              as: 'cr',
              in: { $ifNull: ['$$cr.score', 0] }
            }
          }
        }
      }
    },
    {
      $match: {
        $or: [
          { totalScore: { $gt: myScore } },
          { totalScore: myScore, streak: { $gt: myStreak } },
          { totalScore: myScore, streak: myStreak, lastActiveDate: { $gt: myLast } }
        ]
      }
    },
    { $count: 'cnt' }
  ]);

  return (better[0]?.cnt || 0) + 1;
}

// Helper: Update streak
async function updateStreak(mentee) {
  const today = new Date().toDateString();
  const lastActive = mentee.lastActiveDate?.toDateString();

  if (lastActive !== today) {
    mentee.streak = lastActive === new Date(Date.now() - 86400000).toDateString() 
      ? mentee.streak + 1 
      : 1;
    mentee.lastActiveDate = new Date();
  }
}

// --- Public Leaderboard --- //
// --- Public Leaderboard (same calc as dashboard) --- //
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const skip  = Math.max(parseInt(req.query.skip  || '0', 10), 0);

    // Compute totalScore = sum(completedResources.score)
    const rows = await Mentee.aggregate([
      {
        $project: {
          name: 1,
          streak: { $ifNull: ['$streak', 0] },
          lastActiveDate: 1,
          totalScore: {
            $sum: {
              $map: {
                input: { $ifNull: ['$completedResources', []] },
                as: 'cr',
                in: { $ifNull: ['$$cr.score', 0] }
              }
            }
          }
        }
      },
      // same ordering everywhere: score desc, streak desc, lastActive desc, _id asc (stable)
      { $sort: { totalScore: -1, streak: -1, lastActiveDate: -1, _id: 1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Attach 1-based rank consistent with global order + skip
    const leaderboard = rows.map((m, i) => ({
      rank: skip + i + 1,
      name: m.name,
      totalScore: m.totalScore || 0,
      streak: m.streak || 0
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



module.exports = router;