import axios from "axios";
import { Match, Tournament } from "../../../server/models/tournament.model";

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
export const saveMatches = async  (tournamentId, matches) => {
    try{
        const savedMatches = [];
        for (let match of matches){
            const savedMatch = await Match.create(match);
            savedMatches.push(savedMatch._id);
        }

        await Tournament.findByIdAndUpdate(
            tournamentId,
            { $push: { matches: { $each: savedMatches } } },
            { new: true }
        );
        console.log("Matches saved successfully", savedMatches);
    }catch(err){
        console.log("Error saving matches", err);
    }
}