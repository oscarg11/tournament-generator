// 📝 NOTE: This is a DUPLICATE of the backend tournamentFunctions.js helpers

// SORT GROUP STANDINGS
const sortGroupStandings = (participantA,participantB, matches) => {
    // if points are not equal, sort by points
if(participantB.points !== participantA.points){
    return participantB.points - participantA.points;
} 
if(participantB.goalDifference !== participantA.goalDifference){
    return participantB.goalDifference - participantA.goalDifference;
} 

if(participantB.goalsScored !== participantA.goalsScored){
    return participantB.goalsScored - participantA.goalsScored;
} 
// If still tied, use head-to-head comparison
return headToHeadComparison(participantA, participantB, matches);
}


//HEAD TO HEAD COMPARISON - THIS FUNCTION IS CALLED BY THE SORT FUNCTION
// TO DETERMINE THE FINAL TIE BREAKER
const headToHeadComparison = (participantA, participantB, matches) => {
// Check if there are any matches to compare
if(!Array.isArray(matches) || matches.length === 0){
    console.warn("No matches have been played yet");
    return 0;
}
// Filter in matches between the two participants
const filterHeadToHeadMatches = matches.filter(match => {
    const ids = match.participants.map(p => p.participantId.toString());
    return ids.includes(participantA.participantId.toString())
    && ids.includes(participantB.participantId.toString());
})

// Initialize stats for both participants
let statsA = { points: 0, goalsScored: 0, goalDifference: 0};
let statsB = { points: 0, goalsScored: 0, goalDifference: 0};

//loop through head to head matches
for(const match of filterHeadToHeadMatches) {
    const [p1, p2] = match.participants;

    // convert participantId to string for comparison
    // This is to ensure we are comparing the correct participants
    const p1Id = p1.participantId.toString();
    const p2Id = p2.participantId.toString();
    const aId = participantA._id.toString();
    const bId = participantB._id.toString();

    let aScore, bScore;

    // match participants to the correct ids
    if(p1Id === aId && p2Id === bId){
    aScore = p1.score;
    bScore = p2.score;
    }else if(p1Id === bId && p2Id === aId){
    aScore = p2.score;
    bScore = p1.score;
    }else{
    continue;
    }

    // Update stats based on match result
    if(aScore > bScore){
    statsA.points += 3;
    } else if(aScore < bScore){
    statsB.points += 3;
    } else {
    statsA.points += 1;
    statsB.points += 1;
    }

    // Update goals scored and goal difference
    statsA.goalsScored += aScore;
    statsB.goalsScored += bScore;

    statsA.goalDifference += aScore - bScore;
    statsB.goalDifference += bScore - aScore;
}

    // Update stats
    if(statsA.points !== statsB.points){
    return statsB.points - statsA.points;
    }
    if(statsA.goalDifference !== statsB.goalDifference){
    return statsB.goalDifference - statsA.goalDifference;
    }
    if(statsA.goalsScored !== statsB.goalsScored){
    return statsB.goalsScored - statsA.goalsScored;
    }

    return 0; //still tied
};

export { sortGroupStandings, headToHeadComparison };
