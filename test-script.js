import { generateRandomCube, validateCube } from './backend-node/utils/cubeSolver.js';
import { separateFaces } from './backend-node/utils/cubeInput.js';

// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

const API_URL = 'http://localhost:5000/api/solve';
const NUM_TESTS = 100;

let testsPassed = 0;
let testsFailed = 0;
let testsTotal = 0;
const failedTests = [];

console.log(`\n${'='.repeat(60)}`);
console.log(`   RUBIK'S CUBE SOLVER - COMPREHENSIVE TEST SUITE`);
console.log(`   Testing ${NUM_TESTS} random cube states`);
console.log(`${'='.repeat(60)}\n`);

async function runTest(testNumber) {
  try {
    // Generate random cube state
    const cubeState = generateRandomCube();
    
    // Validate the generated cube
    const validationError = validateCube(cubeState);
    if (validationError) {
      console.log(`❌ Test ${testNumber}: Failed - Invalid generated cube`);
      failedTests.push({
        number: testNumber,
        cubeState,
        error: 'Generated invalid cube: ' + validationError
      });
      testsFailed++;
      return;
    }

    // Call the API endpoint /api/solve
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cubeString: cubeState })
    });

    const result = await response.json();

    if (result.error) {
      console.log(`❌ Test ${testNumber}: API returned error - ${result.error}`);
      failedTests.push({
        number: testNumber,
        cubeState,
        error: result.error
      });
      testsFailed++;
      return;
    }

    if (!result.moves || !Array.isArray(result.moves)) {
      console.log(`❌ Test ${testNumber}: Invalid response format`);
      failedTests.push({
        number: testNumber,
        cubeState,
        error: 'Invalid response format'
      });
      testsFailed++;
      return;
    }

    // Verify solution has reasonable number of moves (max 20 for Kociemba)
    if (result.moveCount > 20) {
      console.log(`⚠️  Test ${testNumber}: Solution is longer than expected (${result.moveCount} moves)`);
    }

    console.log(`✓ Test ${testNumber}: Passed (${result.moveCount} moves) - ${result.moves.join(' ')}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ Test ${testNumber}: Exception - ${error.message}`);
    failedTests.push({
      number: testNumber,
      error: error.message
    });
    testsFailed++;
  }
}

async function runFaceSubmissionTest() {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`   FACE SUBMISSION TEST`);
    console.log(`${'='.repeat(60)}`);

    // Generate a valid cube and split into faces
    const cubeState = generateRandomCube();
    const faces = separateFaces(cubeState);

    // Submit via /api/solve-faces endpoint
    const response = await fetch(API_URL.replace('/api/solve', '/api/solve-faces'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(faces)
    });

    const result = await response.json();

    if (result.error) {
      console.log(`❌ Face submission test failed: ${result.error}`);
      return false;
    }

    if (!result.moves || !Array.isArray(result.moves)) {
      console.log(`❌ Face submission test failed: Invalid response format`);
      return false;
    }

    console.log(`✓ Face submission test passed (${result.moveCount} moves)\n`);
    return true;
  } catch (error) {
    console.log(`❌ Face submission test failed: ${error.message}\n`);
    return false;
  }
}

async function runAllTests() {
  for (let i = 1; i <= NUM_TESTS; i++) {
    await runTest(i);
    testsTotal++;
  }

  // Run face submission test
  const faceTestPassed = await runFaceSubmissionTest();

  // Print summary
  console.log(`${'='.repeat(60)}`);
  console.log(`   TEST SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total Cube Tests:    ${testsTotal}`);
  console.log(`Passed:              ${testsPassed} ✓`);
  console.log(`Failed:              ${testsFailed} ❌`);
  console.log(`Success Rate:        ${(testsPassed / testsTotal * 100).toFixed(2)}%`);
  console.log(`Face Submission:     ${faceTestPassed ? '✓ Passed' : '❌ Failed'}`);
  console.log(`${'='.repeat(60)}`);

  if (testsFailed > 0) {
    console.log(`\n⚠️  FAILED TESTS:\n`);
    for (const test of failedTests) {
      console.log(`Test #${test.number}:`);
      console.log(`  Error: ${test.error}`);
      if (test.cubeState) {
        console.log(`  Cube: ${test.cubeState}`);
      }
      console.log();
    }
  } else {
    console.log(`\n✓ All tests passed! Backend is ready for production.\n`);
  }

  process.exit((testsFailed > 0 || !faceTestPassed) ? 1 : 0);
}

// Check if server is running
fetch(API_URL.replace('/api/solve', '/health'))
  .then(() => runAllTests())
  .catch(() => {
    console.error('❌ Error: Cannot connect to the backend server.');
    console.error('Please make sure the server is running on port 5000');
    console.error('\nRun this command in another terminal:');
    console.error('  npm start\n');
    process.exit(1);
  });
