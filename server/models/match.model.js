const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
    participants: [
        {
            participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
            score: { type: Number, default: 0 }
        }
    ],
    matchNumber : {type: Number, required: true },
    group: { type: String},
    round: {type: Number, required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' }
}, {timestamps: true});

module.exports = mongoose.model('Match', MatchSchema);