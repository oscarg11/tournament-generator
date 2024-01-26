import React, {useState} from 'react'
import axios from 'axios'

const TournamentForm = () => {
  const [tournamentData, setTournamentData] = useState({
    tournamentName: '',
    format: '',
    numberOfGroupStageLegs: '',
    numberOfParticipants: '',
    participants: []
  });

// Temporary state for current participant
  const [currentParticipant, setCurrentParticipant] = useState({
    participantName: '',
    teamName: ''
  });
  
  // errors
  const [errors, setErrors] = useState({});

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    // update current participant details
    if (name === 'participantName' || name === 'teamName') {
      setCurrentParticipant({ ...currentParticipant, [name]: value })
    } else {
      // For other fields, update the tournamentData directly
      setTournamentData(tournamentData => ({ ...tournamentData, [name]: value }));
    }
  };

  // Add participant
  const handleAddParticipant = () => {
  if (currentParticipant.participantName && currentParticipant.teamName) {
    setTournamentData({
      ...tournamentData,
      participants: [...tournamentData.participants, currentParticipant]
    });
    // Clears the current participant
    setCurrentParticipant({ participantName: '', teamName: '' });
    }
  }

  // Delete participant
  const handleDeleteParticipant = index => {
    setTournamentData({
      ...tournamentData,
      participants: tournamentData.participants.filter((_, i) => i !== index)
    });
  };


  const handleSubmit = (e) => {
    e.preventDefault()
    axios.post('http://localhost:8000/api/tournaments', tournamentData)
      .then(res => console.log(res, 'New Tournament created successfully!'))
      .catch((err) => {
        if (err.response && err.response.data) {
          console.log('Error Response:', err.response.data);
  
          // Check if the expected errors object exists
          if (err.response.data.errors) {
            console.log('Validation Errors:', err.response.data.errors);
            setErrors(err.response.data.errors);
          } else {
            // Handle cases where the error format is different
            console.log('An unexpected error occurred:', err.response.data);
            // Optionally, set a general error message
            setErrors({ general: 'An unexpected error occurred.' });
          }
        } else {
          // Handle cases where err.response is undefined
          console.log('Network or other error:', err);
          // Optionally, set a general network error message
          setErrors({ general: 'A network or unknown error occurred.' });
        }
      });
      // .catch((err) => {
      //   console.log('BAD INPUT!!', err.response.data.errors);
      //   setErrors(err.response.data.errors);
      // });
  };


  return (
    <div>
      <h1>Create your Tournament!</h1>
      <form action="" className="col-md-6 offset-2" onSubmit={ handleSubmit }>
        {/* Tournament Name */}
        <div className="form-group mb-3">
        { errors.tournamentName ? <p className="text-danger">{errors.tournamentName.message}</p> : "" }
          <label htmlFor="tournamentName">Tournament Name:</label>
          <input type="text" className="form-control" id="tournamentName value={tournamentData.tournamentName}"
          placeholder="Enter Tournament Name" name='tournamentName' onChange={ onChangeHandler}/>
        </div>
        {/* Format */}
        <div className="form-group mb-3 dropdown">
          { errors.format ? <p className="text-danger">{errors.format.message}</p> : "" }
          <label htmlFor="format">Format:</label>
            <select
              className='form-select'
              id= 'format'
              name='format'
              onChange={ onChangeHandler }
              value={ tournamentData.format}
              >
              <option value=''>Select Format</option>
              <option value='groupAndKnockout'>Group and Knockout</option>
              <option value='knockout'>Knockout</option>
              <option value='league'>League</option>
            </select>
        </div>

        {/*  Conditional input for number of group stage legs */}
        { tournamentData.format === 'groupAndKnockout' && (
          <div className='form-group mb-3'>
            { errors.numberOfGroups ? <p className="text-danger">{errors.numberOfGroups.message}</p> : "" }
            <label htmlFor="numberOfGroupStageLegs">Number of Group Stage Legs:</label>
            <select
              className='form-select'
              id= 'numberOfGroupStageLegs'
              name='numberOfGroupStageLegs'
              value={ tournamentData.numberOfGroupStageLegs}
              onChange={ onChangeHandler }
              >
              <option value=''>Select Number of Group Stage Legs</option>
              <option value='1'>1</option>
              <option value='2'>2</option>
              <option value='3'>3</option>
              <option value="4">4</option>
            </select>
          </div>
        )}

        {/* Number of Participants */}
        <div className="form-group mb-3">
          { errors.numberOfParticipants ? <p className="text-danger">{errors.numberOfParticipants.message}</p> : "" }
          <label htmlFor="numberOfParticipants">Number of Participants:</label>
          <select
            className='form-select'
            id= 'numberOfParticipants'
            name='numberOfParticipants'
            onChange={ onChangeHandler }
            value={ tournamentData.numberOfParticipants}
            >
            <option value=''>Select Number of Participants</option>
            <option value='4'>4</option>
            <option value='8'>8</option>
            <option value='16'>16</option>
            <option value='24'>24</option>
            <option value='32'>32</option>
            <option value="40">40</option>
            <option value="48">48</option>
            <option value="56">56</option>
            <option value="64">64</option>
          </select>
        </div>

        {/* Input fields for Participant's Name & Team Name */}
        <div className="form-group mb-3">
          { errors.participantName ? <p className="text-danger">{errors.participantName.message}</p> : "" }
          <label htmlFor="participantName">Participant's Name:</label>
          <input
            type="text"
            className="form-control"
            id="participantName"
            placeholder="Enter Participant's Name"
            name='participantName' 
            value={currentParticipant.participantName}
            onChange={onChangeHandler} />
          <div>
            { errors.teamName ? <p className="text-danger">{errors.teamName.message}</p> : "" }
            <label htmlFor="teamName">Team Name:</label>
            <input 
              type="text" 
              className="form-control" 
              id="teamName"
              placeholder="Enter Team Name"
              name='teamName'
              value={currentParticipant.teamName}
              onChange={onChangeHandler} />
          </div>
          {/* Button to add a new participant */}
          <button type="button" className='btn btn-success mt-2' onClick={handleAddParticipant}>Add New Participant</button>
        </div>

        {/* Display list of participants in a scrollable box */}
        <div style={{ maxHeight: "1000px", overflowY: "scroll" }}>
          <h3>Participants to Add:</h3>
          <ol  style={{ listStylePosition: 'inside' }}>
            {/* Create an array with a length equal to the selected number of participants */}
            {Array.from({ length: tournamentData.numberOfParticipants }, (_, i) => (
              <li key={i} style={{ marginBottom: '10px',color: tournamentData.participants[i] ? 'black' : '#999' }}>
                {/* Check if a participant exists at this index */}
                {tournamentData.participants[i] ? 
                 // If a participant exists, display their name and team name
                  `${tournamentData.participants[i].participantName} (${tournamentData.participants[i].teamName})`
                  // If a participant does not exist, display a placeholder 
                  :"Participant Name"}
                {tournamentData.participants[i] && (
                  <button type="button" onClick={() => handleDeleteParticipant(i)} style={{ marginLeft: "10px" }}>
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ol>
</div>
        <button className='btn btn-primary'>Create Tournament</button>
      </form>
    </div>
  )
}

export default TournamentForm;