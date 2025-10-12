// scripts/seed.js
/**
 * Main seeding script for different test scenarios
 * Usage:
 *   npm run seed                    - Default: tournament with completed group stage
 *   npm run seed:knockout           - Tournament ready for knockout testing
 *   npm run seed:clean              - Clean database first, then seed
 *   npm run seed:custom             - Custom scenario (edit the script for your needs)
 */

const TournamentTestSetup = require('../test/utils/TournamentTestSetup');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args[0] || 'default';
const shouldClean = args.includes('--clean');

async function runSeed() {
  try {
    // Connect to database
    await TournamentTestSetup.connectDB();

    // Clean if requested
    if (shouldClean) {
      await TournamentTestSetup.cleanDatabase();
    }

    let result;
    
    switch(mode) {
      case 'knockout':
        console.log('🥊 Creating tournament with knockout stage ready...\n');
        result = await seedKnockoutReady();
        break;
        
      case 'knockout-only':
        console.log('🏆 Creating knockout-only tournament...\n');
        result = await seedKnockoutOnly();
        break;
        
      case 'custom':
        console.log('🎯 Creating custom scenario...\n');
        result = await seedCustomScenario();
        break;
        
      default:
        console.log('🏆 Creating tournament with completed group stage...\n');
        result = await seedDefault();
    }

    // Save test data for Postman
    saveTestData(result);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEEDING COMPLETE!');
    console.log('='.repeat(60));
    logNextSteps(result);

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error.stack);
  } finally {
    process.exit();
  }
}

/**
 * Default: Tournament with completed group stage
 */
async function seedDefault() {
  const { tournament, participants, groupMatches, finalists } = 
    await TournamentTestSetup.createWithCompletedGroupStage({
      tournamentName: 'Test Championship 2025',
      simulateScores: true
    });

  // Log group standings
  console.log('\n📊 Group Stage Results:');
  const populatedTournament = await tournament.populate('participants');
  
  for (const group of populatedTournament.groups) {
    console.log(`\nGroup ${group.groupName}:`);
    const groupParticipants = populatedTournament.participants
      .filter(p => group.participants.some(gp => gp.toString() === p._id.toString()))
      .sort((a, b) => {
        // Sort by position in group.participants array
        const aIndex = group.participants.findIndex(id => id.toString() === a._id.toString());
        const bIndex = group.participants.findIndex(id => id.toString() === b._id.toString());
        return aIndex - bIndex;
      });
    
    groupParticipants.forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p.teamName}: ${p.points} pts (${p.wins}W ${p.draws}D ${p.losses}L) GD: ${p.goalDifference}`);
    });
  }

  console.log('\n🎯 Ready for knockout stage creation!');
  
  return {
    tournamentId: tournament._id.toString(),
    mode: 'group-stage-complete',
    groupMatches: groupMatches.length,
    finalists: finalists.length
  };
}

/**
 * Tournament with knockout matches already created
 */
async function seedKnockoutReady() {
  const { tournament, knockoutMatches } = 
    await TournamentTestSetup.createWithKnockoutReady({
      tournamentName: 'Knockout Test Tournament',
      simulateScores: true
    });

  console.log('\n🥊 Knockout Stage Created:');
  
  // Group matches by stage
  const stages = {};
  for (const match of knockoutMatches) {
    if (!stages[match.stage]) stages[match.stage] = [];
    stages[match.stage].push(match);
  }

  // Display matches by stage
  for (const [stage, matches] of Object.entries(stages)) {
    console.log(`\n${stage}:`);
    for (const match of matches) {
      const populated = await match.populate('participants.participantId');
      const p1 = populated.participants[0]?.participantId;
      const p2 = populated.participants[1]?.participantId;
      console.log(`  Match ${match.matchNumber}: ${p1?.teamName || 'TBD'} vs ${p2?.teamName || 'TBD'}`);
    }
  }

  return {
    tournamentId: tournament._id.toString(),
    mode: 'knockout-ready',
    knockoutMatches: knockoutMatches.map(m => ({
      id: m._id.toString(),
      stage: m.stage,
      matchNumber: m.matchNumber
    }))
  };
}

/**
 * Knockout-only tournament (no group stage)
 */
async function seedKnockoutOnly() {
  const { tournament, knockoutMatches } = 
    await TournamentTestSetup.createKnockoutOnly({
      tournamentName: 'Direct Knockout Tournament',
      numberOfParticipants: 4
    });

  console.log('\n🏆 Knockout Tournament Created:');
  
  for (const match of knockoutMatches) {
    const populated = await match.populate('participants.participantId');
    const p1 = populated.participants[0]?.participantId;
    const p2 = populated.participants[1]?.participantId;
    console.log(`  Match ${match.matchNumber} (${match.stage}): ${p1?.teamName || 'TBD'} vs ${p2?.teamName || 'TBD'}`);
  }

  return {
    tournamentId: tournament._id.toString(),
    mode: 'knockout-only',
    matches: knockoutMatches.map(m => ({
      id: m._id.toString(),
      stage: m.stage,
      matchNumber: m.matchNumber
    }))
  };
}

/**
 * Custom scenario - edit this for specific test cases
 */
async function seedCustomScenario() {
  // Example: Create a tournament where all group matches end in draws
  const tournament = await TournamentTestSetup.createCustomScenario({
    tournamentName: 'Draw Test Tournament',
    simulateScores: false, // Don't auto-simulate
    customScores: [
      { matchNumber: 1, score1: 1, score2: 1 },
      { matchNumber: 2, score1: 2, score2: 2 },
      { matchNumber: 3, score1: 0, score2: 0 },
      { matchNumber: 4, score1: 3, score2: 3 },
      { matchNumber: 5, score1: 1, score2: 1 },
      { matchNumber: 6, score1: 2, score2: 2 },
      // Add more as needed
    ]
  });

  console.log('🎯 Custom scenario created with specific match scores');
  
  return {
    tournamentId: tournament._id.toString(),
    mode: 'custom-scenario'
  };
}

/**
 * Save test data to JSON file for Postman
 */
function saveTestData(data) {
  const testData = {
    ...data,
    timestamp: new Date().toISOString(),
    endpoints: {
      viewTournament: `/api/dashboard/${data.tournamentId}`,
      getGroupMatches: `/api/tournaments/${data.tournamentId}/group-stage-matches`,
      getKnockoutMatches: `/api/tournaments/${data.tournamentId}/knockout-stage-matches`,
      concludeGroupStage: `/api/tournaments/${data.tournamentId}/conclude-group-stage`,
      createKnockoutStage: `/api/tournaments/${data.tournamentId}/create-knockout-stage`,
      updateKnockoutMatch: `/api/tournaments/${data.tournamentId}/knockout-matches/[stage]/[index]`
    }
  };

  fs.writeFileSync('test-data.json', JSON.stringify(testData, null, 2));
  console.log('\n📁 Test data saved to: test-data.json');
}

/**
 * Log next steps based on tournament state
 */
function logNextSteps(data) {
  console.log('\n🎯 Next Steps:');
  console.log(`Tournament ID: ${data.tournamentId}`);
  
  switch(data.mode) {
    case 'group-stage-complete':
      console.log('\n1. Create knockout stage:');
      console.log(`   POST /api/tournaments/${data.tournamentId}/create-knockout-stage`);
      console.log('\n2. Then view knockout matches:');
      console.log(`   GET /api/tournaments/${data.tournamentId}/knockout-stage-matches`);
      break;
      
    case 'knockout-ready':
      console.log('\n1. Update a knockout match (e.g., first semi-final):');
      console.log(`   PUT /api/tournaments/${data.tournamentId}/knockout-matches/semiFinals/0`);
      console.log('   Body: { "participant1Score": 2, "participant2Score": 1 }');
      break;
      
    case 'knockout-only':
      console.log('\n1. Play the matches:');
      data.matches?.forEach(match => {
        if (match.stage !== 'Final') {
          console.log(`   PUT /api/tournaments/${data.tournamentId}/knockout-matches/${match.stage}/${data.matches.filter(m => m.stage === match.stage).indexOf(match)}`);
        }
      });
      break;
  }
  
  console.log('\n💡 Tip: Import test-data.json into Postman for easy testing!');
}

// Run the seeder
runSeed();