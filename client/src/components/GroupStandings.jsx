import { useOutletContext } from 'react-router-dom'

const GroupStandings = () => {
  const { tournamentData } = useOutletContext();
  
  //group participants by group name
  console.log("Participants in GroupStandings:", tournamentData.participants);
  
  const participants = tournamentData.participants || [];

  const participantsByGroup = participants.reduce((acc, participant) => {
    const groupName = participant.groupName || 'Ungrouped';
    if(!acc[groupName]){
      acc[groupName] = [];
    }
    acc[groupName].push(participant);
    return acc;
  }, {})

  console.log("Participants grouped by groupName:", participantsByGroup);


  return (
    <div>
      {Object.entries(participantsByGroup).map(
        ([groupName, participants], groupIndex) => {
        if (!Array.isArray(participants)) {
          console.error(`Error: participant at index ${groupIndex} is not an array`, participants);
          return null; // Skip rendering this group
        }

        return (
          <div key={groupName} className='mb-3 container'>
            <div className='row'>
              <table className='table table-bordered'>
                <thead className='table-active'>
                  <tr>
                    <th scope="col">Group {groupName}</th>
                    <th scope="col">MP</th>
                    <th scope="col">W</th>
                    <th scope="col">D</th>
                    <th scope="col">L</th>
                    <th scope="col">GS</th>
                    <th scope="col">GA</th>
                    <th scope="col">GD</th>
                    <th scope="col">PTS</th>
                    <th scope="col">Match History</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant, index) => (
                    <tr key={participant._id || participant.participantName}>

                      <td className='col-2'>
                        {/* styling to keep table postion numbers and participant names aligned */}
                        <div className='d-flex'>
                          <div style={{ width: '2rem', textAlign: 'right', paddingRight:'0.5rem', flexShrink: 0 }}>
                            {index+1}.
                          </div>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                            {participant.participantName} ({participant.teamName})
                          </div>
                        </div>
                        
                      </td>
                      <td>{participant?.matchesPlayed || 0}</td>
                      <td>{participant?.wins || 0}</td>
                      <td>{participant?.draws || 0}</td>
                      <td>{participant?.losses || 0}</td>
                      <td>{participant?.goalsScored || 0}</td>
                      <td>{participant?.goalsAgainst || 0}</td>
                      <td>{participant?.goalDifference || 0}</td>
                      <td>{participant?.points || 0}</td>

                      {/* Color coded match history  */}
                      <td>
                        {participant?.matchHistory?.map((match, index) => (
                          <span
                          key={index}
                          className={`badge rounded-pill text-white px-2 py-1 me-1
                          ${match === 'W' ? 'bg-success' : match === 'L' ? 'bg-danger' : 'bg-secondary'}`}>
                            {match}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};


export default GroupStandings