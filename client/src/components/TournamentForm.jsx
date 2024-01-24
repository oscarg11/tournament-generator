import React, {useState} from 'react'
import axios from 'axios'

const TournamentForm = () => {
  const [tournamentData, setTournamentData] = useState({
    tournamentName: '',
    format: '',
    numberOfParticipants: '',
    participants: [{ participantName: '',teamName: '' }]
  });

// Additional state for the number of legs in group stage
  const [numberOfGroupStageLegs, setNumberOfGroupStageLegs] = useState(''); 


  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    
    if (name === 'numberOfGroupStageLegs') {
      setNumberOfGroupStageLegs(value);
    } else if (name === 'participantName' || name === 'teamName') {
      // Update the last participant in the participants array
      setTournamentData(tournamentData => {
        const updatedParticipants = tournamentData.participants.map((participant, index, arr) => {
          if (index === arr.length - 1) { // Check if it's the last participant
            return { ...participant, [name]: value };
          }
          return participant;
        });
        return { ...tournamentData, participants: updatedParticipants };
      });
    } else {
      // For other fields, update the tournamentData directly
      setTournamentData(tournamentData => ({ ...tournamentData, [name]: value }));
    }
  };

  // Add participant
  const handleAddParticipant = () => {
    const newParticipant = {
      participantName: '',
      teamName: ''
  }
  setTournamentData({
    ...tournamentData,
    participants: [...tournamentData.participants, newParticipant]
  });
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
        console.log('Error detected', err.response.data.errors);
        setErrors(err.response.data.errors);
      });
  };

  // errors
  const [errors, setErrors] = useState({});

  return (
    <div>
      <h1>Create your Tournament!</h1>
      <form action="" className="col-md-6 offset-2" onSubmit={ handleSubmit }>
        {/* Tournament Name */}
        <div className="form-group mb-3">
        { errors.tournamentName ? <p className="text-danger">{errors.tournamentName.message}</p> : "" }
          <label htmlFor="tournamentName">Tournament Name:</label>
          <input type="text" className="form-control" id="tournamentName"
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
              value={ numberOfGroupStageLegs}
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
          <label htmlFor="participantName">Participant's Name:</label>
          <input type="text" className="form-control" id="participantName"
            placeholder="Enter Participant's Name" name='participantName' onChange={onChangeHandler} />
          <label htmlFor="teamName">Team Name:</label>
          <input type="text" className="form-control" id="teamName"
            placeholder="Enter Team Name" name='teamName' onChange={onChangeHandler} />

          {/* Button to add a new participant */}
          <button type="button" onClick={handleAddParticipant}>Add New Participant</button>
        </div>

        {/* Display list of participants in a scrollable box */}
        <div style={{ maxHeight: "200px", overflowY: "scroll" }}>
          {tournamentData.participants.map((participant, index) => (
            <div key={index}>
              <span>{participant.participantName} ({participant.teamName})</span>
              <button type="button" onClick={() => handleDeleteParticipant(index)}>Delete</button>
            </div>
          ))}
        </div>

        <button className='btn btn-primary'>Create Tournament</button>
      </form>
    </div>
  )
}

export default TournamentForm;