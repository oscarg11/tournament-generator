import React from 'react'

const GroupMatches = ({matchData, handleScoreUpdate}) => {
  return (
    <div>
        <form>
            <h2>Matches</h2>
            {matchData.map((match, index) => (
                <div key={index} className='mb-3'>
                    <h3>{`Group ${match.group}`}</h3>
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
  )
}

export default GroupMatches