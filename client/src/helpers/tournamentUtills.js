import axios from "axios";


export const loadTournamentData = async (tournamentId) => {
  try {
    const response = await axios.get(`http://localhost:8000/api/tournament-hub/${tournamentId}`);
    return response.data.oneTournament;  // Replace `oneTournament` if your API returns something different
  } catch (err) {
    console.error("Error loading tournament data:", err);
    throw err;
  }
};


//determin match result
export const determineMatchResult = (participant1, participant2, score,match) => {
    const POINTS_PER_WIN = 3;
    const POINTS_PER_DRAW = 1;
    const POINTS_PER_LOSS = 0;

    console.log("Match structure:", match);


    //scores before the match
    console.log("Score before match", participant1, participant2);
    console.log("Participant1", participant1.scores);
    console.log("Participant2", score.participant2);

    if(score.partcipant1 > score.participant2){
        participant1.points += POINTS_PER_WIN;
        participant1.wins += 1;
        participant2.losses += 1;
        participant2.points += POINTS_PER_LOSS;

        participant1.matchHistory.push("W")
        participant2.matchHistory.push("L")
    } else if(score.participant1 < score.participant2){
        participant2.points += POINTS_PER_WIN;
        participant2.wins += 1;
        participant1.losses += 1;
        participant1.points += POINTS_PER_LOSS;

        participant1.matchHistory.push("L")
        participant2.matchHistory.push("W")
    }else{
        participant1.points += POINTS_PER_DRAW;
        participant2.points += POINTS_PER_DRAW;
        participant1.draws += 1;
        participant2.draws += 1;

        participant1.matchHistory.push("D")
        participant2.matchHistory.push("D")
    }
    // score after the match
    console.log("Score after match", participant1, participant2);
    console.log("Participant1", score.participant1);
    console.log("Participant2", score.participant2);
    return {participant1, participant2}
}

//save matches to the database
export const saveMatches = async (tournamentId, matches) => {
    try {
        const response = await axios.post(
            `http://localhost:8000/api/tournaments/${tournamentId}/save-matches`,
            { matches }
        );
        console.log("Matches saved successfully", response.data);
        return response.data;
    } catch (err) {
        console.error("Error saving matches:", err);
        throw err;
    }
};
