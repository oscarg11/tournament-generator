import React from 'react'

const GroupMatches = ({matchData, handleScoreUpdate}) => {
let lastGroup = ''; //keep track of the last group to compare with the current group

return (
    <div>
        <form>
            <h2>Matches</h2>
            {matchData.map((round, roundIndex) => (
                <div key={roundIndex} className='mb-5'>
                    <h3>{`Round ${roundIndex + 1}`}</h3>  {/* Display round number */}
                    
                    {round.map((match, matchIndex) => {
                        const showGroupHeading = match.group !== lastGroup; // Display group heading only if it's a new group
                        lastGroup = match.group;  // Update lastGroup to the current match's group

                        return (
                            <div key={matchIndex} className='mb-3'>
                                {showGroupHeading && (
                                    <h4>{`Group ${match.group}`}</h4>  // Display group heading only once
                                )}
                                <div className='row'>
                                    <p className='col-6'>
                                        {match.participant1.participantName} vs {match.participant2.participantName}
                                    </p>
                                    <div className='col-4'>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max="100"
                                            value={match.scores.participant1Score}
                                            onChange={(e) => handleScoreUpdate(roundIndex, matchIndex, e.target.value, match.scores.participant2Score)} 
                                        />
                                        <span> - </span>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max="100"
                                            value={match.scores.participant2Score}
                                            onChange={(e) => handleScoreUpdate(roundIndex, matchIndex, e.target.value, match.scores.participant1Score)} 
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </form>
    </div>
);
}


export default GroupMatches