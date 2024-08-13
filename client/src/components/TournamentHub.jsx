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
    matches: [],
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
    console.log(groups, "Groups")
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

   //create group stage matches
  const createGroupStageMatches = (groups) => {
    let Allmatches = [];
    groups.forEach((group, groupIndex) => {
      console.log("Current group participants:", group);
    for( let i = 0; i < group.length; i++){
      for(let j = i + 1; j < group.length; j++){
        const match = {
          participant1: group[i],
          participant2: group[j],
          scores: { participant1Score: 0, participant2Score: 0},
          matchNumber: `${i}-${j}`,
          group: String.fromCharCode(65 + i)
        }
        Allmatches.push(match);
      }
    }
  });
  console.log("matches generated", Allmatches)
  return Allmatches;
  }

  useEffect(() => {
    console.log(`Creating matches for groups ${tournamentData.groups}`);
    if (tournamentData.groups.length > 0) {
      const generatedMatches = createGroupStageMatches(tournamentData.groups);
      console.log(generatedMatches, "Generated Matches")
      setMatchData(generatedMatches);
    }
    console.log("Match Data", matchData)
  }, [tournamentData.groups]);

  return (
    <div>
      <NavBar />
      {/* group stage rendering */}

      {/* tournament details */}
      <h1>{tournamentData.tournamentName}</h1>
      <p>
        Date: {" "}
        {tournamentData.createdAt
          ? new Intl.DateTimeFormat("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date(tournamentData.createdAt))
          : "N/A"
          }
        </p>
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
        <h2>Matches</h2>
        {matchData.map((match, index) => (
            <div key={index} className='mb-3'>
                <h3>{`Match ${match.matchNumber} - Group ${match.group}`}</h3>
                <div className='row'>
                    <p className='col-6'>{match.participant1.participantName} vs {match.participant2.participantName}</p>
                    <div className='col-4'>
                        <input type="number" min="0" max="100"
                               value={match.scores.participant1Score}
                               onChange={(e) => handleScoreUpdate(index, 0, e.target.value, match.scores.participant2Score)} />
                        <span> - </span>
                        <input type="number" min="0" max="100"
                               value={match.scores.participant2Score}
                               onChange={(e) => handleScoreUpdate(index, 1, e.target.value, match.scores.participant1Score)} />
                    </div>
                </div>
            </div>
        ))}
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