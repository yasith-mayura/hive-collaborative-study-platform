/**
 * HIVE — testBatchExtraction.js
 * ─────────────────────────────────────────────────────────────
 * Quick test to verify batch extraction from studentNumber
 * 
 * USAGE:
 *   node tests/testBatchExtraction.js
 * ─────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../src/models/User');

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m',
  cyan: '\x1b[36m', grey: '\x1b[90m', white: '\x1b[97m',
};

const ok = m => console.log(`  ${C.green}✔${C.reset}  ${m}`);
const fail = m => console.log(`  ${C.red}✘${C.reset}  ${m}`);
const info = m => console.log(`  ${C.grey}→${C.reset}  ${m}`);

async function test() {
  console.log('\n' + '─'.repeat(60));
  console.log(`  ${C.bold}${C.white}🧪  HIVE — Batch Extraction Test${C.reset}`);
  console.log('─'.repeat(60) + '\n');

  if (!process.env.MONGO_URI) {
    fail('MONGO_URI not set in .env');
    process.exit(1);
  }

  info('Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGO_URI);
  ok('MongoDB connected\n');

  const testCases = [
    { studentNumber: 'SE/2020/999', expectedBatch: 2020, desc: 'Student from 2020' },
    { studentNumber: 'SE/2021/999', expectedBatch: 2021, desc: 'Student from 2021' },
    { studentNumber: 'SE/2022/999', expectedBatch: 2022, desc: 'Student from 2022' },
    { studentNumber: 'SE/2023/999', expectedBatch: 2023, desc: 'Student from 2023' },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const testEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.hive.kln.ac.lk`;
    
    console.log(`  ${C.bold}Testing:${C.reset} ${testCase.desc}`);
    info(`StudentNumber: ${C.cyan}${testCase.studentNumber}${C.reset}`);
    
    try {
      // Create a test user (without Firebase, just for testing)
      const user = new User({
        name: 'Test User',
        email: testEmail,
        studentNumber: testCase.studentNumber,
        role: 'student',
        isActive: true,
      });

      await user.save();

      if (user.batch === testCase.expectedBatch) {
        ok(`Batch correctly set to ${C.green}${user.batch}${C.reset}`);
        passed++;
      } else {
        fail(`Expected batch ${testCase.expectedBatch}, got ${user.batch}`);
        failed++;
      }

      // Clean up test user
      await User.deleteOne({ _id: user._id });
      
    } catch (err) {
      fail(`Error: ${err.message}`);
      failed++;
    }
    
    console.log('');
  }

  // Test case: User without studentNumber
  console.log(`  ${C.bold}Testing:${C.reset} User without studentNumber`);
  try {
    const user = new User({
      name: 'Admin User',
      email: `admin-test-${Date.now()}@test.hive.kln.ac.lk`,
      role: 'admin',
      isActive: true,
    });

    await user.save();

    if (user.batch === undefined || user.batch === null) {
      ok(`Batch correctly ${C.grey}undefined${C.reset} for non-student`);
      passed++;
    } else {
      fail(`Expected no batch, got ${user.batch}`);
      failed++;
    }

    await User.deleteOne({ _id: user._id });
  } catch (err) {
    fail(`Error: ${err.message}`);
    failed++;
  }

  console.log('');
  console.log('─'.repeat(60));
  console.log(`  ${C.bold}Test Results:${C.reset}`);
  console.log(`  ${C.green}Passed:${C.reset} ${passed}`);
  console.log(`  ${C.red}Failed:${C.reset} ${failed}`);
  console.log('─'.repeat(60) + '\n');

  if (failed === 0) {
    ok('All tests passed! 🎉');
  } else {
    fail(`${failed} test(s) failed`);
  }

  await mongoose.disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

test().catch(err => {
  fail('Crash: ' + err.message);
  console.error(err);
  process.exit(1);
});
