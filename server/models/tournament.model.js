const mongoose = require('mongoose');

const ParticipantsStatsSchema = new mongoose.Schema({
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
    result: { type: String, enum: ['win', 'loss', 'draw'] },
});

const MatchSchema = new mongoose.Schema({
    participants: [ParticipantsStatsSchema],
    matchNumber : {type: Number, required: true },
    group: { type: String, required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: Date.now },
    score: {
        participant1Score: { type: Number, default: 0},
        participant2Score: { type: Number, default: 0}
    }
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
    participants: [ParticipantsStatsSchema],
    matches: [MatchSchema],
    
}, {timestamps: true});


const Tournament = mongoose.model('Tournament', TournamentSchema);
module.exports = Tournament