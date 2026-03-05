// 📝 NOTE: This is a DUPLICATE of the backend tournamentFunctions.js helpers

// This function allows access to the participant name and team name from the participant ID
export const participantLookupFunction = (participants = []) => {
    if (!Array.isArray(participants)) {
        console.warn("🛑 participantLookup called with non-array:", participants);
        return {};
    };

    return participants.reduce((acc, p) => {
        acc[p._id] = p;
        return acc;
    }, {});
}

//front end sort group standings function for display purposes
// client/src/helpers/groupStandingsUtils.js

export const sortGroupStandings = (participantA, participantB, matches) => {
    // Primary tiebreakers
    if (participantB.points !== participantA.points) {
    return participantB.points - participantA.points;
    }
    if (participantB.goalDifference !== participantA.goalDifference) {
    return participantB.goalDifference - participantA.goalDifference;
    }
    if (participantB.goalsScored !== participantA.goalsScored) {
    return participantB.goalsScored - participantA.goalsScored;
    }

    // Final tiebreaker
    return headToHeadComparison(participantA, participantB, matches);
    };

    // Convenience wrapper 
    export const getSortedGroupStandings = (participants, matches) => {
    return [...participants].sort((a, b) => sortGroupStandings(a, b, matches));
    };

    // -------------------------
    // Head-to-head (client shape)
    // match.participants = [{ participantId, score }, { participantId, score }]
    // -------------------------
    const headToHeadComparison = (participantA, participantB, matches) => {
    if (!Array.isArray(matches) || matches.length === 0) return 0;

    const aId = participantA?._id?.toString();
    const bId = participantB?._id?.toString();
    if (!aId || !bId) return 0;

    // Only completed matches should affect head-to-head
    const headToHeadMatches = matches.filter((match) => {
    if (match?.status !== "completed") return false;

    const ps = match?.participants;
    if (!Array.isArray(ps) || ps.length < 2) return false;

    const ids = ps.map((p) => p?.participantId?.toString());
    return ids.includes(aId) && ids.includes(bId);
    });

    if (headToHeadMatches.length === 0) return 0;

    let statsA = { points: 0, goalsScored: 0, goalDifference: 0 };
    let statsB = { points: 0, goalsScored: 0, goalDifference: 0 };

    for (const match of headToHeadMatches) {
    const [p1, p2] = match.participants;

    const p1Id = p1?.participantId?.toString();
    const p2Id = p2?.participantId?.toString();

    // Scores might be undefined if something is weird; default to 0
    const p1Score = Number(p1?.score ?? 0);
    const p2Score = Number(p2?.score ?? 0);

    let aScore, bScore;

    // Align scores to A vs B regardless of order in participants array
    if (p1Id === aId && p2Id === bId) {
        aScore = p1Score;
        bScore = p2Score;
    } else if (p1Id === bId && p2Id === aId) {
        aScore = p2Score;
        bScore = p1Score;
    } else {
        continue; // not actually an A vs B match (shouldn't happen due to filter)
    }

    // Points from head-to-head
    if (aScore > bScore) statsA.points += 3;
    else if (aScore < bScore) statsB.points += 3;
    else {
        statsA.points += 1;
        statsB.points += 1;
    }

    // Goals + GD
    statsA.goalsScored += aScore;
    statsB.goalsScored += bScore;

    statsA.goalDifference += aScore - bScore;
    statsB.goalDifference += bScore - aScore;
    }

    // Compare head-to-head stats
    if (statsA.points !== statsB.points) return statsB.points - statsA.points;
    if (statsA.goalDifference !== statsB.goalDifference)
    return statsB.goalDifference - statsA.goalDifference;
    if (statsA.goalsScored !== statsB.goalsScored)
    return statsB.goalsScored - statsA.goalsScored;

    return 0;
    }; 
