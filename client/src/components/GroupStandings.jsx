import React from 'react'


const GroupStandings = ({groups = []}) => {
  if (!Array.isArray(groups)) {
    console.error("Error: `groups` is not an array", groups);
    return <div>Error loading groups.</div>;
  }

  //filter head to head matches
  const filterHeadToHeadMatches = matches.filter(match => {
    const ids = match.participants.map(p => p.participantId.toString());
    return ids.includes(participantA.participantId.toString())
    && ids.includes(participantB.participantId.toString());
  });

  // Head to head comparison
  const headToHeadComparison = (participantA, participantB, filterHeadToHeadMatches) => {
    let statsA = { points: 0, goalsScored: 0, goalDifference: 0};
    let statsB = { points: 0, goalsScored: 0, goalDifference: 0};

    for(const match of filterHeadToHeadMatches) {
      const [p1, p2] = match.participants;

      const p1Id = p1.participantId.toString();
      const p2Id = p2.participantId.toString();
      const aId = participantA._id.toString();
      const bId = participantB._id.toString();

      let aScore, bScore;

      // match participants to the correct ids
      if(p1Id === aId && p2Id === bId){
        aScore = p1.score;
        bScore = p2.score;
      }else if(p1Id === bId && p2Id === aId){
        aScore = p2.score;
        bScore = p1.score;
      }else{
        continue;
      }

      statsA.goalsScored += aScore;
      statsB.goalsScored += bScore;

      statsA.goalDifference += aScore - bScore;
      statsB.goalDifference += bScore - aScore;
    }
    
      // Update stats
      if(statsA.points !== statsB.points){
        return statsB.points - statsA.points;
      }
      if(statsA.goalDifference !== statsB.goalDifference){
        return statsB.goalDifference - statsA.goalDifference;
      }
      if(statsA.goalsScored !== statsB.goalsScored){
        return statsB.goalsScored - statsA.goalsScored;
      }
      return 0;

  }

    

  // Sort participants by points, goal difference, and goals scored
  const sortGroupStandings = (participantA,participantB) => {
    if(participantB.points !== participantA.points) return participantB.points - participantA.points;

    if(participantB.goalDifference !== participantA.goalDifference) return participantB.goalDifference - participantA.goalDifference;

    if(participantB.goalsScored !== participantA.goalsScored) return participantB.goalsScored - participantA.goalsScored;

    if(participantB === participantA) return headToHeadComparison(participantA, participantB);

  }

  return (
    <div>
       {groups.map((group, groupIndex) => {
        if (!Array.isArray(group.participants)) {
          console.error(`Error: participant at index ${groupIndex} is not an array`, group.participants);
          return null; // Skip rendering this group
        }

        return (
          <div key={group._id} className='mb-3 container'>
            <div className='row'>
              <table className='table table-bordered'>
                <thead className='table-active'>
                  <tr>
                    <th scope="col">Group {group.groupName}</th>
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
                  {group.participants.map((participant, index) => (
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