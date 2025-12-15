const mongoose = require('mongoose');
const Participant = require('./participant.model');
const Match = require('./match.model');

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
    participants: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }],
        default: []
    },
    groups: [
        {
            groupName: { type: String, required: true },
            participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }]
        }
    ],
    matches: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
        default: []
    },
    groupStageConcluded: {type: Boolean, default: false},
    finalists: [
        {
            participant:{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
            group: { type: String, required: true },
            rank: { type: Number,
                    enum: [1, 2],
                    required: true
            }
        }
    ],
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'started','concluded'], default: 'pending' },
}, {timestamps: true});


const Tournament = mongoose.model('Tournament', TournamentSchema);

module.exports = Tournament;