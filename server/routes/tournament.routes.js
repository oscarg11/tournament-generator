const TournamentController = require("../controllers/tournament.controller")

module.exports = app => {
    app.get('/api/tournaments', TournamentController.findAllTournaments);
    app.get('/api/tournament/group-stage/:_id', TournamentController.findOneTournament);
    app.post('/api/tournaments/create', TournamentController.createTournament );
    app.patch('/api/tournaments/:id', TournamentController.updateTournament);
    app.delete('/api/tournaments/:id', TournamentController.deleteTournament);
};