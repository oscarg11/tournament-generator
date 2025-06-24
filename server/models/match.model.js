const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
    participants: [
        {
            participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
            score: { type: Number, default: 0 }
        }
    ],
    matchNumber : {type: Number, required: true},
    group: { type: String},
    round: {
        type: Number,
        required: function (){
            return this.stage === 'group' // Only required for group matches
        }
    },
    stage: {
        type: String,
        enum: ['group', 'roundOfSixteen', 'quarterFinals', 'semiFinals', 'Final']
    },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    nextMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    nextSlotIndex: { type: Number,enum: [0,1]},
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant',
        default: null // Initially no winner
    }

}, {timestamps: true});

module.exports = mongoose.model('Match', MatchSchema);