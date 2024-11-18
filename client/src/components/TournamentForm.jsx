import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import NavBar from '../components/NavBar';

const TournamentForm = () => {
  const [tournamentData, setTournamentData] = useState({
    tournamentName: '',
    format: '',
    numberOfGroupStageLegs: '',
    numberOfParticipants: '',
    participants: []
  });

  const navigate = useNavigate();


// Temporary state for current participant
  const [currentParticipant, setCurrentParticipant] = useState({
    participantName: '',
    teamName: ''
  });
  
  // errors state
  const [errors, setErrors] = useState({});


  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    // update current participant details
    if (name === 'participantName' || name === 'teamName') {
      setCurrentParticipant({ ...currentParticipant, [name]: value })
    } else {
      setTournamentData(tournamentData => ({ ...tournamentData, [name]: value }));
    }
  };


  // Add participant & validation
  const handleAddParticipant = () => {
    let localErrors = {};
    if (!currentParticipant.participantName || currentParticipant.participantName.length < 2) {
      localErrors.participantName = { message: "A name is required and must be at least 2 characters." };
    }
    if (!currentParticipant.teamName || currentParticipant.teamName.length < 2) {
      localErrors.teamName = { message: "Team name is required and must be at least 2 characters." };
    }
    //If there are errors, set them and return
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }
      setTournamentData({
        ...tournamentData,
        participants: [...tournamentData.participants, currentParticipant]
      });
      // Clears the current participant
      setCurrentParticipant({ participantName: '', teamName: '' });
      setErrors({}); // Clear any errors
    };
  

  // Delete participant
  const handleDeleteParticipant = index => {
    setTournamentData({
      ...tournamentData,
      participants: tournamentData.participants.filter((_, i) => i !== index)
    });
  };


  const handleSubmit = (e) => {
    e.preventDefault()
    // Validate that all participants are complete
    if(tournamentData.participants.length < parseInt(tournamentData.numberOfParticipants)){
      setErrors(prevErrors => ({
        ...prevErrors,
        incommpleteParticipants: 'Please complete all participants'
      }))
      return;
    }else if(tournamentData.participants.length > parseInt(tournamentData.numberOfParticipants)){
      setErrors(prevErrors => ({
        ...prevErrors,
        incommpleteParticipants: 'Too many participants'
      }))
      return;
    }
    axios.post('http://localhost:8000/api/tournaments/create-tournament', tournamentData)
      .then(res => {
        console.log(res, 'New Tournament created successfully!');
        //reset form upon successful submission
        setTournamentData({
          tournamentName: '',
          format: '',
          numberOfGroupStageLegs: '',
          numberOfParticipants: '',
          participants: []
        });
       // const tournamentId = res.data._id;
       // navigate(`/group-stage/${tournamentId}`);
      navigate('/dashboard');
        setErrors({});
      })
      .catch(err => {
        if (err.response && err.response.data && err.response.data.error && err.response.data.error.errors) {
            //Validation error handling
            console.error('Validation Errors:', err.response.data.error.errors);
            setErrors(err.response.data.error.errors);
        } else {
            //General error handling
            console.error('Submission error:', err);
            setErrors({ general: 'An error occurred. Please try again.' });
        }
    });
};


  return (
    <div className='container-fluid'>
      <NavBar />
      <div className='container py-5'>
        <h1>Create your Tournament!</h1>
        <form action="" className="row" onSubmit={ handleSubmit }>
          {/* Tournament Name */}
          <div className="col-md-8">
            <div className="form-group mb-3">
            { errors.tournamentName ? <p className="text-danger">{errors.tournamentName.message}</p> : "" }
              <label htmlFor="tournamentName">Tournament Name:</label>
              <input type="text" className="form-control" id="tournamentName" value={tournamentData.tournamentName}
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
                { errors.numberOfGroupStageLegs ? <p className="text-danger">{errors.numberOfGroupStageLegs.message}</p> : "" }
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
          </div>
          
          <div className="col-md-4">
              {/* Participant's Name */}
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
                {/* Team Name */}
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
              {}
              <h3>Participants to Add:</h3>
              {/* Incomplete participants validtation message */}
              {errors.incommpleteParticipants && <p className="text-danger">{errors.incommpleteParticipants}</p>}
              <ol  style={{ listStylePosition: 'inside' }}>

              {tournamentData.participants.map((participant, index) => (
              <li key={index} style={{ marginBottom: '10px', color: 'black' }}>
                {/* Display the participant's name and team name */}
                {`${participant.participantName} (${participant.teamName})`}
                {/* Delete button for each participant */}
                <button className='btn btn-danger' onClick={() => handleDeleteParticipant(index)} style={{ marginLeft: "10px" }}>
                  Delete
                </button>
              </li>
              ))}
                
              </ol>
            </div>
          </div>
          <div className='col-md-12'>
            <button className='btn btn-primary'>Create Tournament</button>
          </div>
    
        </form>
      </div>
    </div>
  )
}

export default TournamentForm;