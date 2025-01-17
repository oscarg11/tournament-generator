import React from 'react'


const GroupStandings = ({groups = []}) => {
  return (
    <div>
        { groups.map((group, groupIndex) => (
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
    </div>
  )
}

export default GroupStandings