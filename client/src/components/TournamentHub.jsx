import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import axios from 'axios'
import NavBar from './NavBar'

const POINTS_PER_WIN = 3;
const POINTS_PER_DRAW = 1;
const POINTS_PER_LOSS = 0;

const TournamentHub = () => {
  const { tournamentId } = useParams();
  console.log(tournamentId, "Tournament ID")
  const [tournamentData, setTournamentData] = useState({
    participants: [],
    groups: [],
    numberOfGroupStageLegs: 0,
  });

  const [matchData, setMatchData] = useState([]);

  //shuffle participants
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  //create groups
  function createGroups(participants){
    let groups = [];

    if (participants.length === 4){
      groups.push(participants);
    }else{
      const groupCount = participants.length / 4;
      for (let i = 0; i < groupCount; i++){
        groups.push(participants.slice(i * 4, (i + 1) * 4));
      }
    }
    return groups;
  }

  //update scores
  const handleScoreUpdate = (groupIndex, participantIndex, score, opponentScore) => {
    const newGroups = [...tournamentData.groups];
    const participant = newGroups[groupIndex][participantIndex];
    participant.matchesPlayed += 1;
    participant.goalsScored += score;
    participant.goalsAgainst += opponentScore;
    participant.goalDifference = participant.goalsScored - participant.goalsAgainst;

    if (score > opponentScore){
      participant.points += POINTS_PER_WIN;
    } else if (score === opponentScore){
      participant.points += POINTS_PER_DRAW;
    } else {
      participant.points += POINTS_PER_LOSS;
    }
  }

  useEffect(() => {
    console.log(`Fetching data for tournament ID: ${tournamentId}`);
    axios.get(`http://localhost:8000/api/tournament-hub/${tournamentId}`)
    .then(res =>{ 
      const tournamentData = res.data.oneTournament;
      console.log(tournamentData, "Tournament data")

      let groups = [];
      if (tournamentData.format === 'groupAndKnockout'){
        const shuffledParticipants = [...tournamentData.participants];
        shuffle(shuffledParticipants);
        groups = createGroups(shuffledParticipants);
      }

      setTournamentData({...tournamentData, groups});
      console.log(tournamentData, "Tournament data")
    })
    .catch(err => console.log("Failed to fetch tournament data", err));
  }, [tournamentId]);

  return (
    <div>
      <NavBar />
      <h1>{tournamentData.tournamentName}</h1>
      <p>Format: {tournamentData.format}</p>
      {tournamentData.format === 'groupAndKnockout' && <p>Number of group stage legs: {tournamentData.numberOfGroupStageLegs}</p>}
      {/* groups */}
      { tournamentData.groups.map((group, groupIndex) => (
      <div key={ groupIndex } className='mb-3 container'>
        <div className='row'>
        <table className='table table-bordered'>
            <thead className='table-active'>
              <tr>
                  <th scope='"col'>Group { String.fromCharCode(65 + groupIndex) } </th>
                  <th scope='col'>P</th>
                  <th scope='col'>W</th>
                  <th scope='col'>D</th>
                  <th scope='col'>L</th>
                  <th scope='col'>GS</th>
                  <th scope='col'>GA</th>
                  <th scope='col'>GD</th>
                  <th scope='col'>PTS</th>
                  </tr>
                </thead>
                <tbody key = { groupIndex }>
                
                  {group.map((participant, index) => (
                    <tr key={index}>
                      <td className='col-2'>{participant.participantName} ({participant.teamName})</td>
                      <td>{participant?.matchesPlayed || 0}</td>
                      <td>{participant?.wins || 0}</td>
                      <td>{participant?.draws || 0}</td>
                      <td>{participant?.losses || 0}</td>
                      <td>{participant?.goalsScored || 0}</td>
                      <td>{participant?.goalsAgainst || 0}</td>
                      <td>{participant?.goalDifference || 0}</td>
                      <td>{participant?.points || 0}</td>
                    </tr>
                  ))}
                </tbody>
          </table>
        </div>
      </div>
              ))}
    {/* match making */}
    <div>
        <form>
          <label htmlFor="roundNum">Round {}</label>
        </form>
    </div>

    {tournamentData.format === 'league' && (
      <>
        <h2>Participants (Alphabetical Order)</h2>
        <ul>
          {[...tournamentData.participants]
            .sort((a, b) => a.participantName.localeCompare(b.participantName))
            .map((participant, index) => (
              <li key={index}>{participant.participantName} - {participant.teamName}</li>
          ))}
        </ul>
      </>
  )}

    </div>
  )
}


export default TournamentHub