const TournamentController = require("../controllers/tournament.controller")
const ParticipantController = require("../controllers/participant.controller")

module.exports = app => {
    app.get('/api/tournaments/all-tournaments', TournamentController.findAllTournaments);
    app.get('/api/dashboard/:_id', TournamentController.findOneTournament);
    console.log("TournamentController", TournamentController)
    app.post('/api/tournaments/create-tournament', TournamentController.createTournament );
    app.patch('/api/tournaments/:id', TournamentController.updateTournament);
    app.delete('/api/tournaments/:id', TournamentController.deleteTournament);
    
    //save participants
    app.post('/api/participants/create-participant', ParticipantController.createParticipant);
    
    // save matches
    app.patch('/api/tournaments/:id/save-matches', TournamentController.saveMatches);
    app.get('/api/tournaments/:id/group-stage-matches', TournamentController.getGroupStageMatches);
    
    // update match scores
    app.put('/api/tournaments/:tournamentId/matches/:roundIndex/:matchIndex', TournamentController.updateGroupStageMatchScores);
};