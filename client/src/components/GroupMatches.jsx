import React, {useState, useEffect} from 'react'
import axios from 'axios'

const GroupMatches = ({tournamentData, setTournamentData}) => {
    const [matchData, setMatchData] = useState([]);

// onChange handler
const onChangeHandler = (e, roundIndex, matchIndex, participantIndex) => {
  const updatedMatches = [...matchData];
  updatedMatches[roundIndex][matchIndex].participants[participantIndex].score = parseInt(e.target.value) || 0;
  setMatchData(updatedMatches);
};


//handle score submit
const handleScoreSubmit = (e, tournmanentId, roundIndex, matchIndex) =>{
    e.preventDefault();

    //get the current match
    const updatedMatchData = [...matchData];
    const matchToSubmit = updatedMatchData[roundIndex][matchIndex];


    //update backend with the new match data
    axios.put(`http://localhost:8000/api/tournaments/${tournamentData._id}/matches/${roundIndex}/${matchIndex}`, matchToSubmit)
    .then(res => {
      console.log("Match updated successfully", res.data);
      //update the match data in the state
      updatedMatchData[roundIndex][matchIndex] = matchToSubmit;
      setMatchData(updatedMatchData);
    })
    .catch(err => console.log("Error updating match", err));
    
}

useEffect(() => {
  const fetchGroupMatches = async () => {
    try {
      console.log("Fetching group matches for tournament:", tournamentData._id);

      const response = await axios.get(`http://localhost:8000/api/tournaments/${tournamentData._id}/group-stage-matches`);
      console.log("Fetched group matches:", response.data.matches);

      setMatchData(response.data.matches);
    } catch (err) {
      console.error("Error fetching group matches:", err);
    }

    if(tournamentData._id){
      fetchGroupMatches();
    }
  }
}, [tournamentData._id]);

return (
    <div>
        <form onSubmit={ handleScoreSubmit }>
          <h2>Group Matches</h2>
          {/* Iterate over rounds of matches */}
          {matchData.map((round, roundIndex) =>{
            // Get the current group from the first match in the round
            const currentGroup = round[0]?.group || '';

            return (
              <div key={roundIndex} className='mb-5'>
                {/* display group name */}
                {roundIndex === 0 && (
                  <h3>{`Group ${currentGroup}`}</h3>
                )}
                {/* Round number */}
                <h4>{`Round ${roundIndex + 1}`}</h4>

                {/* Iterate over matches in the current round */}
                <div className='row g-3 justify-content-center'>    {/* Each round is a row */}
                  {round.map((match, matchIndex) => (
                    // match card
                    <div key={matchIndex} className='col-md-4'>     {/* Each match card is a colum*/}
                      <div className="card p-3 align-items-center">
                        <div className='card-body d-flex'>
                          {/* participant 1 */}
                          <label className='me-2'>
                            {tournamentData.participants.find(
                              (participant) => participant._id === match.participants[0]?.participantId
                            )?.participantName}
                          </label>

                          {/* score input for participant1 */}
                          <input
                              type='number'
                              className='form-control me-2'
                              style={{width: "60px"}}
                              min='0'
                              max='100'
                              value={match.participants[0]?.score || 0}
                              onChange={(e) => onChangeHandler(e, roundIndex, matchIndex, 1)}
                              >
                          </input>

                          <span className='mx-2'>-</span>

                          {/* score input for participant2 */}
                          <input
                              type='number'
                              className='form-control me-2'
                              style={{width: "60px"}}
                              min='0'
                              max='100'
                              value={match.participants[1]?.score || 0}
                              onChange={(e) => onChangeHandler(e, roundIndex, matchIndex, 2)}
                              >
                          </input>

                          {/* participant 2 */}
                          <label className='ms-2'>
                          {tournamentData.participants.find(
                              (participant) => participant._id === match.participants[1]?.participantId
                            )?.participantName}
                          </label>
                        </div>
                        {/* submit scores button */}
                      <button type='submit'
                              className='btn btn-primary mt-2'
                              onClick={(e) => handleScoreSubmit(e, tournamentData._id, roundIndex, matchIndex)}
                              >Confirm</button>
                      </div>
                    </div>
                    ))}

                  </div>
              </div>
            )
          })}
        </form>
    </div>
);
}


export default GroupMatches