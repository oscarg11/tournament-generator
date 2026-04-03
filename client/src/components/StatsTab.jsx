import React from 'react'
import { useOutletContext } from 'react-router-dom'

const StatsTab = () => {
  const { tournamentData, matchData } = useOutletContext();
  
  const participants = tournamentData.participants || [];
  
  // Sort participants by most goals to least
  const sortedGoalScorers = [...participants].sort((a,b) => b.goalsScored - a.goalsScored);

  //get the top 5 goal scorers
  const topFiveScorers = sortedGoalScorers.slice(0,5);

  const minimumGoalsToQualify = topFiveScorers.length >= 5 
    ? topFiveScorers[4].goalsScored 
    : 0;
  
  const topScorersIncludingTies = sortedGoalScorers.filter(
    player => player.goalsScored >= minimumGoalsToQualify
  );

  //DEALING WITH GOAL SCORING TIES
  let currentRank = 1; 
  const palyersWithRanks = topScorersIncludingTies.map((player, index) => {
    //first player is always rank 1
    if(index === 0){
      currentRank = 1;
    }else{
      //get the previous player
      const previousPlayer = topScorersIncludingTies[index - 1];

      //check if goals are different from the previous player
      if(player.goalsScored !== previousPlayer.goalsScored){
        currentRank = index + 1; //update rank to current index + 1 (because index is 0-based)
      }
      //if goals are equal, currentRank stays the same. (no update)
    }
    return { ...player, rank: currentRank };
  })

  //sort participants by least goals against for Best Defense Stat
  const sortedBestDefense = [...participants].sort((a,b) => a.goalsAgainst - b.goalsAgainst);

  //get top 5 best defenses
  const topFiveDefenses = sortedBestDefense.slice(0,5);

  const maximumGoalsAgainstToQualify = topFiveDefenses.length >= 5
    ? topFiveDefenses[4].goalsAgainst
    : Infinity; // if there are less than 5 participants, set to Infinity to include all

  const bestDefensesIncludingTies = sortedBestDefense.filter(
    player => player.goalsAgainst <= maximumGoalsAgainstToQualify
  );
  
  //DEALING WITH GOALS AGAINST TIES
  let currentDefenseRank = 1;
  const defensesWithRanks = bestDefensesIncludingTies.map((player, index) => {
    if(index === 0){
      currentDefenseRank = 1;
    }else{
      const previousPlayer = bestDefensesIncludingTies[index - 1];
      if(player.goalsAgainst !== previousPlayer.goalsAgainst){
        currentDefenseRank = index + 1;
      }
    }
    return { ...player, rank: currentDefenseRank };
  })


  return (
    <div className='container'>
      {/* Top Goal Scorers Table */}
      <div className='container'>
        <h2>Top Goal Scorers</h2>
          <table className='table table-bordered'>
            <thead className='table-active'>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Goals</th>
              </tr>
            </thead>
            <tbody>
              {palyersWithRanks.map((player, index) => (
                <tr key={player._id}>  {/* Changed to _id */}
                  <td>{player.rank}</td>  {/* Rank - now handles ties */}
                  <td>{player.participantName} ({player.teamName})</td>
                  <td>{player.goalsScored}</td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {/* Best Defense Table */}
      <div className='container'>
        <h2>Best Defenses</h2>
          <table className='table table-bordered'>
            <thead className='table-active'>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Goals Against</th>
              </tr>
            </thead>
            <tbody>
              {defensesWithRanks.map((player, index) => (
                <tr key={player._id}>  {/* Changed to _id */}
                  <td>{player.rank}</td>  {/* Rank - now handles ties */}
                  <td>{player.participantName} ({player.teamName})</td>
                  <td>{player.goalsAgainst}</td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

    </div>
  )
}


export default StatsTab