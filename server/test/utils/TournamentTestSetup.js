// test/utils/TournamentTestSetup.js
const mongoose = require('mongoose');
const Tournament = require('../../models/tournament.model');
const Participant = require('../../models/participant.model');
const Match = require('../../models/match.model');

const { 
  shuffle,
  createGroups,
  createGroupStageMatches,
  getSortedGroupStandings,
  recalculateAllParticipantStats
} = require("../../helpers/tournamentFunctions");

/**
 * Tournament Test Setup Utility
 * Provides methods to quickly create tournaments in various states for testing
 */
class TournamentTestSetup {
  
  /**
   * Default participant data for testing
   */
  static defaultParticipants = [
    { participantName: 'John Smith', teamName: 'Team Alpha' },
    { participantName: 'Sarah Johnson', teamName: 'Team Beta' },
    { participantName: 'Mike Davis', teamName: 'Team Gamma' },
    { participantName: 'Emma Wilson', teamName: 'Team Delta' },
    { participantName: 'Alex Brown', teamName: 'Team Epsilon' },
    { participantName: 'Lisa Garcia', teamName: 'Team Zeta' },
    { participantName: 'Tom Martinez', teamName: 'Team Eta' },
    { participantName: 'Anna Lee', teamName: 'Team Theta' }
  ];

  /**
   * Connect to test database
   */
  static async connectDB() {
    const dbUri = process.env.TEST_DB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/tournament_test';
    
    if (!mongoose.connection.readyState) {
    console.log("Connecting to DB:", dbUri);
      await mongoose.connect(dbUri);
      console.log('✅ Connected to test database');
    }
  }

  /**
   * Clean all test data
   */
  static async cleanDatabase() {
    await Tournament.deleteMany({});
    await Participant.deleteMany({});
    await Match.deleteMany({});
    console.log('🧹 Database cleaned');
  }

  /**
   * Create a tournament with completed group stage, ready for knockout
   * @param {Object} options - Configuration options
   * @returns {Object} { tournament, participants, groupMatches, finalists }
   */
  static async createWithCompletedGroupStage(options = {}) {
    const config = {
      tournamentName: options.tournamentName || `Test Tournament ${Date.now()}`,
      numberOfParticipants: options.numberOfParticipants || 8,
      numberOfGroups: options.numberOfGroups || 2,
      numberOfGroupStageLegs: options.numberOfGroupStageLegs || 1,
      simulateScores: options.simulateScores !== false, // Default true
      participants: options.participants || this.defaultParticipants
    };

    // Create participants
    const participantInstances = await Participant.insertMany(config.participants.slice(0, config.numberOfParticipants));
    const participantIds = participantInstances.map(p => p._id);

    // Create groups
    const shuffledParticipants = shuffle([...participantIds]);
    const groups = createGroups(shuffledParticipants);

    // Assign group names to participants
    for (const group of groups) {
      await Participant.updateMany(
        { _id: { $in: group.participants } },
        { $set: { groupName: group.groupName } }
      );
    }

    // Generate group matches
    const { allMatches } = createGroupStageMatches(groups, config.numberOfGroupStageLegs);

    // Create tournament
    const tournament = await Tournament.create({
      tournamentName: config.tournamentName,
      format: 'groupAndKnockout',
      numberOfParticipants: config.numberOfParticipants,
      numberOfGroupStageLegs: config.numberOfGroupStageLegs,
      participants: participantIds,
      groups: groups,
      matches: []
    });

    // Save matches
    const matchInstances = await Match.insertMany(allMatches);
    tournament.matches = matchInstances.map(m => m._id);
    await tournament.save();

    // Simulate scores if requested
    if (config.simulateScores) {
      await this.simulateGroupMatches(tournament._id);
    }

    // Calculate final standings and determine finalists
    const finalTournament = await this.concludeGroupStage(tournament._id);

    return {
      tournament: finalTournament,
      participants: participantInstances,
      groupMatches: matchInstances,
      finalists: finalTournament.finalists
    };
  }

  /**
   * Create a tournament with knockout stage ready
   * @param {Object} options - Configuration options
   * @returns {Object} { tournament, knockoutMatches }
   */
  static async createWithKnockoutReady(options = {}) {
    // First create with completed group stage
    const { tournament } = await this.createWithCompletedGroupStage(options);

    // Create knockout matches
    const knockoutMatches = await this.createKnockoutMatches(tournament._id);

    return {
      tournament,
      knockoutMatches
    };
  }

  /**
   * Create just a knockout tournament (no group stage)
   * @param {Object} options - Configuration options
   * @returns {Object} { tournament, knockoutMatches }
   */
  static async createKnockoutOnly(options = {}) {
    const config = {
      tournamentName: options.tournamentName || `Knockout Tournament ${Date.now()}`,
      numberOfParticipants: options.numberOfParticipants || 4,
      participants: options.participants || this.defaultParticipants.slice(0, 4)
    };

    // Create participants
    const participantInstances = await Participant.insertMany(config.participants);
    const participantIds = participantInstances.map(p => p._id);

    // Create tournament
    const tournament = await Tournament.create({
      tournamentName: config.tournamentName,
      format: 'knockout',
      numberOfParticipants: config.numberOfParticipants,
      participants: participantIds,
      groups: [],
      matches: []
    });

    // Create knockout matches directly
    const knockoutMatches = [];
    let matchNumber = 1;

    // Create semi-finals (for 4 participants)
    for (let i = 0; i < participantIds.length; i += 2) {
      const match = await Match.create({
        participants: [
          { participantId: participantIds[i], score: 0 },
          { participantId: participantIds[i + 1], score: 0 }
        ],
        matchNumber: matchNumber++,
        stage: 'semiFinals',
        status: 'pending'
      });
      knockoutMatches.push(match);
    }

    // Create final
    const finalMatch = await Match.create({
      participants: [
        { participantId: null, score: 0 },
        { participantId: null, score: 0 }
      ],
      matchNumber: matchNumber++,
      stage: 'Final',
      status: 'pending'
    });
    
    // Create third place match
const thirdPlaceMatch = await Match.create({
  participants: [
    { participantId: null, score: 0 },
    { participantId: null, score: 0 }
  ],
  matchNumber: matchNumber++,
  stage: 'thirdPlaceMatch',
  status: 'pending'
});

knockoutMatches[0].nextMatchId = finalMatch._id;
knockoutMatches[0].nextSlotIndex = 0;
knockoutMatches[0].thirdPlaceMatchId = thirdPlaceMatch._id;
knockoutMatches[0].thirdPlaceSlotIndex = 0;

knockoutMatches[1].nextMatchId = finalMatch._id;
knockoutMatches[1].nextSlotIndex = 1;
knockoutMatches[1].thirdPlaceMatchId = thirdPlaceMatch._id;
knockoutMatches[1].thirdPlaceSlotIndex = 1;

    await knockoutMatches[0].save();
    await knockoutMatches[1].save();
    
   knockoutMatches.push(finalMatch, thirdPlaceMatch);




    // Update tournament with matches
    tournament.matches = knockoutMatches.map(m => m._id);
    await tournament.save();

    return {
      tournament,
      knockoutMatches
    };
  }

  /**
   * Simulate group matches with random scores
   * @param {String} tournamentId
   */
  static async simulateGroupMatches(tournamentId) {
    const tournament = await Tournament.findById(tournamentId).populate('matches');
    const groupMatches = tournament.matches.filter(m => m.stage === 'group');

    for (const match of groupMatches) {
      const score1 = Math.floor(Math.random() * 5);
      const score2 = Math.floor(Math.random() * 5);
      
      match.participants[0].score = score1;
      match.participants[1].score = score2;
      match.status = 'completed';
      
      if (score1 > score2) {
        match.winner = match.participants[0].participantId;
      } else if (score2 > score1) {
        match.winner = match.participants[1].participantId;
      }
      
      await match.save();
    }

    // Recalculate all stats
    const updatedTournament = await Tournament.findById(tournamentId)
      .populate('participants')
      .populate('matches');
    
    await recalculateAllParticipantStats(updatedTournament);
  }

  /**
   * Conclude group stage and determine finalists
   * @param {String} tournamentId
   * @returns {Object} Updated tournament with finalists
   */
  static async concludeGroupStage(tournamentId) {
    const tournament = await Tournament.findById(tournamentId)
      .populate('participants')
      .populate('matches');

    const finalists = [];

    for (const group of tournament.groups) {
      const groupParticipants = await Participant.find({ 
        _id: { $in: group.participants } 
      });
      
      const groupMatches = tournament.matches
        .filter(m => m.group === group.groupName)
        .map(m => m.toObject());
      
      const standings = getSortedGroupStandings(groupParticipants, groupMatches);
      
      // Top 2 advance
      finalists.push(
        { participant: standings[0]._id, group: group.groupName, rank: 1 },
        { participant: standings[1]._id, group: group.groupName, rank: 2 }
      );
      
      // Update group with sorted order
      group.participants = standings.map(p => p._id);
    }

    tournament.finalists = finalists;
    tournament.groupStageConcluded = true;
    tournament.markModified('groups');
    await tournament.save();

    return tournament;
  }

  /**
   * Create knockout matches for a tournament
   * @param {String} tournamentId
   * @returns {Array} Created knockout matches
   */
  static async createKnockoutMatches(tournamentId) {
    // This simulates calling your API endpoint
    const tournament = await Tournament.findById(tournamentId).populate('finalists.participant');
    
    if (!tournament.finalists || tournament.finalists.length < 4) {
      throw new Error('Tournament must have finalists before creating knockout stage');
    }

    const knockoutMatches = [];
    let matchNumber = tournament.matches.length + 1;

    // Create semi-finals (A1 vs B2, B1 vs A2)
    const groupAFinalists = tournament.finalists.filter(f => f.group === 'A');
    const groupBFinalists = tournament.finalists.filter(f => f.group === 'B');

    const semiFinal1 = await Match.create({
      participants: [
        { participantId: groupAFinalists.find(f => f.rank === 1).participant, score: 0 },
        { participantId: groupBFinalists.find(f => f.rank === 2).participant, score: 0 }
      ],
      matchNumber: matchNumber++,
      stage: 'semiFinals',
      status: 'pending'
    });

    const semiFinal2 = await Match.create({
      participants: [
        { participantId: groupBFinalists.find(f => f.rank === 1).participant, score: 0 },
        { participantId: groupAFinalists.find(f => f.rank === 2).participant, score: 0 }
      ],
      matchNumber: matchNumber++,
      stage: 'semiFinals',
      status: 'pending'
    });

    // Create final
    const final = await Match.create({
      participants: [
        { participantId: null, score: 0 },
        { participantId: null, score: 0 }
      ],
      matchNumber: matchNumber++,
      stage: 'Final',
      status: 'pending'
    });

    // Link semi-finals to final
    semiFinal1.nextMatchId = final._id;
    semiFinal1.nextSlotIndex = 0;
    semiFinal2.nextMatchId = final._id;
    semiFinal2.nextSlotIndex = 1;
    
    await semiFinal1.save();
    await semiFinal2.save();

    knockoutMatches.push(semiFinal1, semiFinal2, final);

    // Update tournament
    tournament.matches.push(...knockoutMatches.map(m => m._id));
    await tournament.save();

    return knockoutMatches;
  }

  /**
   * Create a custom scenario
   * @param {Object} scenario - Custom scenario configuration
   */
  static async createCustomScenario(scenario) {
    // This allows you to create specific test cases
    // For example: tied games, specific scores, etc.
    const { tournament } = await this.createWithCompletedGroupStage(scenario);
    
    if (scenario.customScores) {
      // Apply custom scores to specific matches
      for (const customScore of scenario.customScores) {
        const match = await Match.findOne({ 
          matchNumber: customScore.matchNumber,
          _id: { $in: tournament.matches }
        });
        
        if (match) {
          match.participants[0].score = customScore.score1;
          match.participants[1].score = customScore.score2;
          match.status = 'completed';
          await match.save();
        }
      }
      
      // Recalculate stats
      const updatedTournament = await Tournament.findById(tournament._id)
        .populate('participants')
        .populate('matches');
      await recalculateAllParticipantStats(updatedTournament);
    }
    
    return tournament;
  }
}

module.exports = TournamentTestSetup;