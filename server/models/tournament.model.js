const mongoose = require('mongoose');

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
        required: true
    },
    numberOfGroups: {
        type: Number,
        required: function() {
            // Required only for the groupAndKnockout format
            return this.format === 'groupAndKnockout';
        },
        min: [1, "There must be at least one group."]
    },
    numberOfMatches: {
        type: Number,
        required: function() {
            // Required for both groupAndKnockout and league formats
            return this.format === 'groupAndKnockout' || this.format === 'league';
        },
        min: [1, "There must be at least one match."]
    },
    participants: [
        {
            firstName: {
                type: String,
                required: [true, "First name is required"],
                minlength: [2, "First name must be at least 2 characters"]
            },
            lastName: {
                type: String,
                required: [true, "Last name is required"],
                minlength: [2, "Last Name must be at least 2 characters"]
            },
            teamName: {
                type: String,
                required: [true, "Team name is required"],
                minlength: [2, "Team Name must be at least 2 characters"]
                }
        }
    ]
}, {timestamps: true});

const Tournament = mongoose.model('Tournament', TournamentSchema);
module.exports = Tournament