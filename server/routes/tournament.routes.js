const TournamentController = require("../controllers/tournament.controller")

module.exports = app => {
    app.get('/api/tournaments/all-tournaments', TournamentController.findAllTournaments);
    app.get('/api/tournament-hub/:_id', TournamentController.findOneTournament);
    app.post('/api/tournaments/create-tournament', TournamentController.createTournament );
    app.patch('/api/tournaments/:id', TournamentController.updateTournament);
    app.delete('/api/tournaments/:id', TournamentController.deleteTournament);

    // save matches
    app.patch('/api/tournaments/:id/save-matches', TournamentController.saveMatches);


    // update match scores
    app.put('/api/tournaments/:tournamentId/matches/:roundIndex/:matchIndex', TournamentController.updateGroupStageMatchScores);
};