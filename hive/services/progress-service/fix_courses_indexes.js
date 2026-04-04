require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./src/models/Course');

(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hive';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const col = db.collection('courses');

  const docs = await col.find({}).toArray();
  let migrated = 0;
  for (const doc of docs) {
    const code = String(doc.subjectCode || doc.courseCode || '').trim().toUpperCase();
    if (!code) continue;
    const compact = code.replace(/\s+/g, '');
    const last = compact.slice(-1);
    const credits = parseInt(last, 10);

    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          subjectCode: code,
          subjectName: String(doc.subjectName || doc.courseName || '').trim(),
          level: Number(doc.level || doc.year || 1),
          semester: Number(doc.semester || 1),
          status: doc.status || 'compulsory',
          specialisationTrack: doc.specialisationTrack || null,
          creditHours: Number.isInteger(credits) && credits > 0 ? credits : null,
          isActive: doc.isActive !== false,
        },
      }
    );
    migrated += 1;
  }

  const dups = await col.aggregate([
    { $match: { subjectCode: { $type: 'string', $ne: '' } } },
    { $group: { _id: '$subjectCode', ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();

  let removed = 0;
  for (const dup of dups) {
    const ordered = await col.find({ _id: { $in: dup.ids } }).sort({ updatedAt: -1, createdAt: -1, _id: -1 }).toArray();
    const dropIds = ordered.slice(1).map((d) => d._id);
    if (dropIds.length > 0) {
      await col.deleteMany({ _id: { $in: dropIds } });
      removed += dropIds.length;
    }
  }

  await col.deleteMany({ $or: [{ subjectCode: { $exists: false } }, { subjectCode: null }, { subjectCode: '' }] });

  for (const indexName of ['courseCode_1', 'year_1']) {
    try {
      await col.dropIndex(indexName);
    } catch (_) {}
  }

  const syncResult = await Course.syncIndexes();
  const indexes = await col.indexes();

  console.log(JSON.stringify({
    db: db.databaseName,
    migrated,
    duplicateGroups: dups.length,
    removed,
    syncResult,
    indexes,
  }, null, 2));

  await mongoose.disconnect();
})();
