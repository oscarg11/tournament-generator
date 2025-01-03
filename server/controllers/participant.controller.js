const Participant = require("../models/tournament.model");

module.exports.createParticipant = async (req, res) => {
    try{
        const participant = await Participant.create(req.body);
        res.json({participant});
    }catch(err){
        console.log("Error creating participants", err);
        res.status(500).json({message: "Error creating participants", error: err});
    }
}