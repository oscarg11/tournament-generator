const TournamentController = require("../controllers/tournament.controller")

module.exports = app => {
    app.get('/api/tournaments/all-tournaments', TournamentController.findAllTournaments);
    app.get('/api/dashboard/:id', TournamentController.findOneTournament);
    app.post('/api/tournaments/create-tournament', TournamentController.createTournament );
    app.patch('/api/tournaments/:id', TournamentController.updateTournament);
    app.delete('/api/tournaments/all-tournaments/:id', TournamentController.deleteTournament);

    //Conclude group stage
    app.patch('/api/tournaments/:id/conclude-group-stage', TournamentController.concludeGroupStage);

    // Create knockout stage
    app.post('/api/tournaments/:id/create-knockout-stage', TournamentController.createKnockoutMatches);
};