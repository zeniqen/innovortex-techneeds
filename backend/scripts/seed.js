/**
 * Fills the platform with something to look at.
 *
 * It makes sure there is a mentor who has mentees to look after, a mentee
 * with work to do, and a piece of work for each of them. It prints the
 * credentials so they can be signed into.
 *
 *   npm run seed
 *
 * It is safe to run again: an account that is already there is left alone
 * unless its password is not the demo one, in which case the password is
 * put back so the account can be signed into.
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');
const Program = require('../models/Program');
const Resource = require('../models/Resource');

const DEMO_PASSWORD = 'techneeds-demo';

async function seed() {
  await connectDB();

  // The program with the most mentees on it. A mentor put on that program
  // gets a panel with something in it; a mentor on an empty one does not.
  const busiest = await Mentee.aggregate([
    { $unwind: '$programs' },
    { $group: { _id: '$programs', n: { $sum: 1 } } },
    { $sort: { n: -1 } },
    { $limit: 1 },
  ]);

  let program = busiest.length
    ? await Program.findById(busiest[0]._id)
    : await Program.findOne();

  if (!program) {
    program = await Program.create({
      name: 'Web Development Bootcamp',
      description: 'An introduction to building for the web.',
      track: 'web development'
    });
    console.log(`\nCreated the program ${program.name}.`);
  }

  // --- the mentor ---------------------------------------------------------

  let mentor = await Mentor.findOne({ email: 'smith@example.com' });
  if (!mentor) {
    mentor = await Mentor.create({
      name: 'Dr. Smith',
      email: 'smith@example.com',
      password: await bcrypt.hash(DEMO_PASSWORD, 10),
      title: 'Mentor',
      skills: ['JavaScript', 'React', 'Node'],
      programs: [program._id]
    });
    console.log(`Created the mentor ${mentor.email}.`);
  } else if (!(await bcrypt.compare(DEMO_PASSWORD, mentor.password))) {
    // The account was already there with a password nobody knows, so the
    // demo cannot be signed into. Put it back to the demo password.
    mentor.password = await bcrypt.hash(DEMO_PASSWORD, 10);
    await mentor.save();
    console.log(`Reset the password for ${mentor.email}.`);
  }

  // Put the mentor on the busiest program, so the panel has mentees.
  if (!mentor.programs.some((id) => id.toString() === program._id.toString())) {
    mentor.programs.push(program._id);
    await mentor.save();
    console.log(`Put ${mentor.email} on ${program.name}.`);
  }
  if (!program.mentors.some((id) => id.toString() === mentor._id.toString())) {
    program.mentors.push(mentor._id);
    await program.save();
  }

  // --- the mentee ---------------------------------------------------------

  let mentee = await Mentee.findOne({ enrollmentNumber: 'DEMO0001' });
  if (!mentee) {
    mentee = await Mentee.create({
      name: 'Demo Student',
      email: 'demo.student@example.com',
      enrollmentNumber: 'DEMO0001',
      password: await bcrypt.hash(DEMO_PASSWORD, 10),
      interests: ['React', 'CSS'],
      programs: [program._id]
    });
    console.log(`Created the mentee ${mentee.enrollmentNumber}.`);
  } else if (!(await bcrypt.compare(DEMO_PASSWORD, mentee.password))) {
    mentee.password = await bcrypt.hash(DEMO_PASSWORD, 10);
    await mentee.save();
  }

  if (!mentee.programs.some((id) => id.toString() === program._id.toString())) {
    mentee.programs.push(program._id);
    await mentee.save();
  }

  // --- the work -----------------------------------------------------------

  // A video to watch and a project to hand in, so both of the mentee's
  // paths through the panel have something on them.
  const video = await Resource.findOne({ program: program._id, type: 'video' });
  if (!video) {
    const created = await Resource.create({
      title: 'Intro to React hooks',
      type: 'video',
      url: 'https://react.dev/learn/state-a-components-memory',
      description: 'Work through the state section of the React guide.',
      tags: ['react', 'hooks'],
      maxScore: 20,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      program: program._id,
      addedBy: mentor._id
    });
    program.resources.push(created._id);
    await program.save();
    console.log(`Created the resource ${created.title}.`);
  }

  const project = await Resource.findOne({ program: program._id, type: 'project' });
  if (!project) {
    const created = await Resource.create({
      title: 'Build a link shortener',
      type: 'project',
      description: 'Build it, deploy it, and hand in the link.',
      tags: ['node', 'deployment'],
      maxScore: 50,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      program: program._id,
      addedBy: mentor._id
    });
    program.resources.push(created._id);
    await program.save();
    console.log(`Created the project ${created.title}.`);
  }

  // The work the demo mentee has already finished, so their profile, their
  // badges and their place on the leaderboard are not empty.
  const done = await Resource.find({ program: program._id }).sort({
    maxScore: 1,
  });

  let marked = 0;
  for (const resource of done) {
    const has = mentee.completedResources.some(
      (entry) => entry.resource.toString() === resource._id.toString()
    );
    if (has) continue;

    const score = Math.max(1, Math.round(resource.maxScore * 0.8));
    mentee.completedResources.push({
      resource: resource._id,
      score,
      completedOn: new Date(Date.now() - (done.length - marked) * 86400000),
      verified: true
    });
    mentee.totalScore = (mentee.totalScore || 0) + score;
    marked += 1;
  }

  if (marked > 0) {
    mentee.streak = 3;
    await mentee.save();
    console.log(`Marked ${marked} pieces of work for ${mentee.enrollmentNumber}.`);
  }

  console.log('\nThe demo accounts:');
  console.log(`  mentor   ${mentor.email} / ${DEMO_PASSWORD}`);
  console.log(`  mentee   ${mentee.enrollmentNumber} / ${DEMO_PASSWORD}`);
  console.log(`  program  ${program.name}\n`);

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
