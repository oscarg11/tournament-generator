
//determin Group match result
export function determineGroupMatchResult (participant1, participant2, score,match) {
  const POINTS_PER_WIN = 3;
  const POINTS_PER_DRAW = 1;
  const POINTS_PER_LOSS = 0;

  console.log("Before Match updates");
 // console.log("Participant1", participant1);
  //console.log("Participant2", participant2);
  console.log("Received Score Object:", score);
console.log("Participant 1 Score:", score.participant1);
console.log("Participant 2 Score:", score.participant2);
  console.log("Participant 1 - Goals Scored:", participant1.goalsScored, "Goals Against:", participant1.goalsAgainst);
      console.log("Participant 2 - Goals Scored:", participant2.goalsScored, "Goals Against:", participant2.goalsAgainst);
  
  // check if match is already completed
  console.log("Match status BEFORE check:", match.status);
  // 
  if(match.status === 'pending'){

      //participant 1 wins
      if(score.participant1 > score.participant2){
          participant1.matchesPlayed += 1;
          participant1.wins += 1;
          participant1.goalsScored += score.participant1;
          participant1.goalsAgainst += score.participant2;
          participant1.goalDifference = participant1.goalsScored - participant1.goalsAgainst;
          participant1.points += POINTS_PER_WIN;
          participant1.matchHistory.push("W")

          participant2.matchesPlayed += 1;
          participant2.losses += 1;
          participant2.goalsScored += score.participant2;
          participant2.goalsAgainst += score.participant1;
          participant2.goalDifference = participant2.goalsScored - participant2.goalsAgainst;
          participant2.points += POINTS_PER_LOSS;
          participant2.matchHistory.push("L")

          match.status = 'completed'; // Update match status to completed
      
      //participant 2 wins
      } else if(score.participant1 < score.participant2){
          participant2.matchesPlayed += 1;
          participant2.wins += 1;
          participant2.goalsScored += score.participant2;
          participant2.goalsAgainst += score.participant1;
          participant2.goalDifference = participant2.goalsScored - participant2.goalsAgainst;
          participant2.points += POINTS_PER_WIN;
          participant2.matchHistory.push("W")

          participant1.matchesPlayed += 1;
          participant1.losses += 1;
          participant1.goalsScored += score.participant1;
          participant1.goalsAgainst += score.participant2;
          participant1.goalDifference = participant1.goalsScored - participant1.goalsAgainst;
          participant1.points += POINTS_PER_LOSS;
          participant1.matchHistory.push("L")

          match.status = 'completed'; // Update match status to completed

      //draw
      }else{
          participant1.matchesPlayed += 1;
          participant1.draws += 1;
          participant1.goalsScored += score.participant1;
          participant1.goalsAgainst += score.participant2;
          participant1.goalDifference = participant1.goalsScored - participant1.goalsAgainst;
          participant1.points += POINTS_PER_DRAW;
          participant1.matchHistory.push("D")

          participant2.matchesPlayed += 1;
          participant2.draws += 1;
          participant2.goalsScored += score.participant2;
          participant2.goalsAgainst += score.participant1;
          participant2.goalDifference = participant2.goalsScored - participant2.goalsAgainst;
          participant2.points += POINTS_PER_DRAW;
          participant2.matchHistory.push("D")

          match.status = 'completed'; // Update match status to completed
      }

      console.log("After Update:");
      console.log("Participant 1 - Goals Scored:", participant1.goalsScored, "Goals Against:", participant1.goalsAgainst, "Goal Difference:", participant1.goalDifference);
      console.log("Participant 2 - Goals Scored:", participant2.goalsScored, "Goals Against:", participant2.goalsAgainst, "Goal Difference:", participant2.goalDifference);
      
      return {participant1, participant2}
  }
}

