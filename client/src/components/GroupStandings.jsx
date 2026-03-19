import { useOutletContext } from 'react-router-dom'
import React, {useState, useEffect} from 'react'
import axios from 'axios'

const GroupStandings = () => {
  const { tournamentData, refetchCounter } = useOutletContext();
  const [standings, setStandings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    console.log("🔵 GroupStandings useEffect fired");
    console.log("🔵 tournamentData._id:", tournamentData._id);
    console.log("🔵 tournamentData.updatedAt:", tournamentData.updatedAt);
    const fetchStandings = async () => {
      if (!tournamentData?._id) return;
      try {
        setLoading(true);
        console.log("🔵 Fetching standings...");
        const res = await axios.get(
          `http://localhost:8000/api/tournaments/${tournamentData._id}/group-standings`
        );
        console.log("🔵 Standings response:", res.data.standings);
        setStandings(res.data.standings);
      } catch (err) {
        console.error("Error fetching standings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [tournamentData._id, refetchCounter]);

  if(loading) return <p>Loading Standings...</p>;

  return (
    <div>
      {Object.entries(standings).map(([groupName, participants], groupIndex) => {
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