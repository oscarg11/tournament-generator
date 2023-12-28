const TournamentController = require("../controllers/tournament.controller")

module.exports = app => {
    app.get('/api/tournaments', TournamentController.findAllTournaments);
    app.get('/api/tournaments/:id', TournamentController.findOneTournament);
    app.post('/api/tournaments', TournamentController.createTournament );
    app.patch('/api/tournaments/:id', TournamentController.updateTournament);
    app.delete('/api/tournaments/:id', TournamentController.deleteTournament);
};