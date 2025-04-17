const MatchController = require('../controllers/match.controller');

module.exports = app => {
    // save matches
    app.patch('/api/tournaments/:id/save-matches', MatchController.saveMatches);
    
    // get group stage matches
    app.get('/api/tournaments/:id/group-stage-matches', MatchController.getGroupStageMatches);
    
    // update group stage match scores
    app.put('/api/tournaments/:tournamentId/group-matches/:roundIndex/:matchIndex', MatchController.updateGroupStageMatchScores);

    // reset group stage match
    app.put('/api/tournaments/:tournamentId/reset-group-match/:roundIndex/:matchIndex', MatchController.resetGroupStageMatch);
}

