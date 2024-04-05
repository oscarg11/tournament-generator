const mongoose = require('mongoose');

const ParticipantsStatsSchema = new mongoose.Schema({
    goalsScored: {type: Number, defualt: 0},
    goalsAgainst: {type: Number, defuault: 0}
})

const MatchSchema = new mongoose.Schema({
    participants: [{
        participantName: {type: String, required: true},
        teamName: {type: String, required: true},
        stats: ParticipantsStatsSchema,
    }],
    matchNumber : {type: Number, required: true },
    group: { type: String, required: true },
    score: {
        participant1: {type: Number, defualt: 0 },
        participant2: {type: Number, defualt: 0 }
    },
});

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
        {
            participantName: {
                type: String,
                required: [true, "A name is required"],
                minlength: [2, "First name must be at least 2 characters"]
            },
            teamName: {
                type: String,
                required: [true, "Team name is required"],
                minlength: [2, "Team Name must be at least 2 characters"]
                }
        }
    ],
    matches: [MatchSchema],
    
}, {timestamps: true});


const Tournament = mongoose.model('Tournament', TournamentSchema);
module.exports = Tournament