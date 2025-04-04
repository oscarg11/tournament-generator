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

module.exports = mongoose.model('Participant', ParticipantSchema); // Export the model