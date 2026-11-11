/**
 * Moves the resources that were made before the model was changed onto the
 * fields the model uses now.
 *
 * The older resources carry a `heading` instead of a `title`, a
 * `video_link` instead of a `url` and an `assigned_score` instead of a
 * `maxScore`. Nothing reads them, so they show up with no name and no
 * score.
 *
 *   npm run migrate:resources
 *
 * It only touches the resources that still have the old names, and it
 * prints what it changed.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Resource = require('../models/Resource');

async function migrate() {
  await connectDB();
  const collection = mongoose.connection.db.collection('resources');

  const old = await collection
    .find({ heading: { $exists: true } })
    .project({ heading: 1, video_link: 1, assigned_score: 1, type: 1 })
    .toArray();

  if (old.length === 0) {
    console.log('Every resource already uses the current fields.');
    await mongoose.disconnect();
    return;
  }

  let changed = 0;
  for (const resource of old) {
    const update = {};
    if (resource.heading) update.title = resource.heading;
    if (resource.video_link) update.url = resource.video_link;
    if (typeof resource.assigned_score === 'number') {
      update.maxScore = resource.assigned_score;
    }
    if (!resource.type) update.type = 'video';

    await collection.updateOne({ _id: resource._id }, { $set: update });
    changed += 1;
  }

  console.log(`Moved ${changed} resources onto the current fields.`);

  await mongoose.disconnect();
}

migrate().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
