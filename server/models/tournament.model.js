const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
    participantName: {
        type: String,
        required: [true, "A name is required"],
        minlength: [2, "First name must be at least 2 characters"]
    },
    teamName: {
        type: String,
        required: [true, "Team name is required"],
        minlength: [2, "Team Name must be at least 2 characters"]
        },
    goalsScored: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    goalDifference: { type: Number, default: 0 },
    points: { type: Number, default: 0},
    matchesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    matchHistory: {
        type: [String],
        default: []
    }
}, {timestamps: true});

const MatchSchema = new mongoose.Schema({
    participants: [
        {
            participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
            score: { type: Number, default: 0 }
        }
    ],
    matchNumber : {type: Number, required: true },
    group: { type: String, required: true },
    round: {type: Number, required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: Date.now },
    result: { type: String, enum: ['pending', 'draw', 'win', 'loss'], default: 'pending' }
}, {timestamps: true});

const TournamentSchema = new mongoose.Schema({
    tournamentName:{
        type: String,
        required: [true, "A name for your Tournament is required."],
        minlength: [2, "Tournament Name must be at least 2 characters."]
    },
    format: {
        type: String,
        required: [true, "Please select a format for your tournament."],
        enum: ['groupAndKnockout', 'knockout', 'league'],
    },
    numberOfParticipants: {
        type: Number,
        required: [true, "Please select the number of participants."],
    },
    numberOfGroupStageLegs: {
        type: Number,
        required: [function() { //only required if format is groupAndKnockout
            return this.format === 'groupAndKnockout';
        }, "Please select the number of group stage legs."],
    },
    participants: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }
    ],
    matches: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Match' }
    ],
    
}, {timestamps: true});

const Participant = mongoose.model('Participant', ParticipantSchema);
const Match = mongoose.model('Match', MatchSchema);
const Tournament = mongoose.model('Tournament', TournamentSchema);

module.exports = {Participant, Match, Tournament};