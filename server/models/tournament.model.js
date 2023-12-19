const mongoose = require('mongoose');

const TournamentSchema = new mongoose.Schema({
    tournamentName:{
        type: String,
        required: [true, "A name for your Tournament is required."],
        minlength: [2, "Tournament Name must be at least 2 characters."]
    },
    format: {
        type: String,
        enum: ['groupAndKnockout', 'knockout', 'league'],
        default: 'groupAndKnockout',
    },
    numberOfParticipants: {
        type: Number,
        required: true
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