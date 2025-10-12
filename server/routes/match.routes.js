const MatchController = require('../controllers/match.controller');

module.exports = app => {
    // save matches
    app.patch('/api/tournaments/:id/save-matches', MatchController.saveMatches);
    
    // get group stage matches
    app.get('/api/tournaments/:id/group-stage-matches', MatchController.getGroupStageMatches);

    //get knockout stage matches
    app.get('/api/tournaments/:id/knockout-stage-matches', MatchController.getKnockoutStageMatches);
    
    // update group stage match scores
    app.put('/api/tournaments/:tournamentId/group-matches/:roundIndex/:matchIndex', MatchController.updateGroupStageMatchScores);

    // update knockout stage match scores
    app.put('/api/tournaments/:tournamentId/knockout-matches/:stageName/:matchIndex', MatchController.updateKnockoutStageMatch);

    // reset group stage match
    app.put('/api/tournaments/:tournamentId/reset-group-match/:roundIndex/:matchIndex', MatchController.resetGroupStageMatch);

    // reset knockout stage match
    app.put('/api/tournaments/:tournamentId/reset-knockout-match/:stageName/:matchIndex', MatchController.resetKnockoutStageMatch);
}

