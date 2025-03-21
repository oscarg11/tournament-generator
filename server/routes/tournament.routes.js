const TournamentController = require("../controllers/tournament.controller")

module.exports = app => {
    app.get('/api/tournaments/all-tournaments', TournamentController.findAllTournaments);
    app.get('/api/dashboard/:id', TournamentController.findOneTournament);
    app.post('/api/tournaments/create-tournament', TournamentController.createTournament );
    app.patch('/api/tournaments/:id', TournamentController.updateTournament);
    app.delete('/api/tournaments/:id', TournamentController.deleteTournament);
    
    // save matches
    app.patch('/api/tournaments/:id/save-matches', TournamentController.saveMatches);
    app.get('/api/tournaments/:id/group-stage-matches', TournamentController.getGroupStageMatches);
    
    // update group stage match scores
    app.put('/api/tournaments/:tournamentId/group-matches/:roundIndex/:matchIndex', TournamentController.updateGroupStageMatchScores);
};