/**
 * Fills an empty database with something to look at.
 *
 * It makes one program, one mentor and one mentee, and prints the
 * credentials so they can be signed into.
 *
 *   npm run seed
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

  // A program to put the demo accounts on. If there is one already, use
  // it: the point of the seed is to give somebody something to sign in
  // with, not to empty the database.
  let program = await Program.findOne();
  if (!program) {
    program = await Program.create({
      name: 'Web Development Bootcamp',
      description: 'An introduction to building for the web.',
      track: 'web development'
    });
    console.log(`\nCreated the program ${program.name}.`);
  }

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
    if (!program.mentors.includes(mentor._id)) program.mentors.push(mentor._id);
    await program.save();
    console.log(`Created the mentor ${mentor.email}.`);
  } else if (!(await bcrypt.compare(DEMO_PASSWORD, mentor.password))) {
    // The account was already there with a password nobody knows, so the
    // demo cannot be signed into. Put it back to the demo password.
    mentor.password = await bcrypt.hash(DEMO_PASSWORD, 10);
    await mentor.save();
    console.log(`Reset the password for ${mentor.email}.`);
  }

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
  }

  const resource = await Resource.findOne({ program: program._id });
  if (!resource) {
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

  // A project as well as a video, so there is something to hand in.
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

  console.log('\nThe demo accounts:');
  console.log(`  mentor   ${mentor.email} / ${DEMO_PASSWORD}`);
  console.log(`  mentee   ${mentee.enrollmentNumber} / ${DEMO_PASSWORD}\n`);

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
