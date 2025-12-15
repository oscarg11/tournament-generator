const TournamentController = require("../controllers/tournament.controller")

module.exports = app => {
    app.get('/api/tournaments/all-tournaments', TournamentController.findAllTournaments);
    app.get('/api/dashboard/:id', TournamentController.findOneTournament);
    app.delete('/api/tournaments/all-tournaments/:id', TournamentController.deleteTournament);

    // CREATE TOURNAMENT SHELL
    app.post('/api/tournaments/create-tournament', TournamentController.createTournament );

    // UPDATE TOURNAMENT WITH PARTICIPANTS
    app.patch('/api/tournaments/:id/add-participant', TournamentController.addParticipantToTournament);

    // START TOURNAMENT
    app.post('/api/tournaments/:id/start-tournament', TournamentController.startTournament);

    //Conclude group stage
    app.patch('/api/tournaments/:id/conclude-group-stage', TournamentController.concludeGroupStage);

    // Create knockout stage
    app.post('/api/tournaments/:id/create-knockout-stage', TournamentController.createKnockoutMatches);
};