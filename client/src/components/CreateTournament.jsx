import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import NavBar from './NavBar';

const CreateTournament = () => {
  const [tournamentData, setTournamentData] = useState({
    tournamentName: '',
    format: '',
    numberOfGroupStageLegs: '',
    numberOfParticipants: ''
  });

  const navigate = useNavigate();
  
  // errors state
  const [errors, setErrors] = useState({});

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setTournamentData(prev => ({
      ...prev,
      [name]: ['numberOfGroupStageLegs', 'numberOfParticipants'].includes(name) ? parseInt(value) : value
    }));
    // Clear specific field error on change
    setErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault()
    axios.post('http://localhost:8000/api/tournaments/create-tournament', tournamentData)
      .then(res => {
        const tournamentId = res.data.tournament._id;
        console.log(res, 'New Tournament created successfully!', res.data.tournament);

        //reset form upon successful submission
        setTournamentData({
          tournamentName: '',
          format: '',
          numberOfGroupStageLegs: '',
          numberOfParticipants: '',
        });

        //navigate to the overview page
        navigate(`/dashboard/${tournamentId}/overview`);
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

//disable submit button until all required fields are filled
const isSubmitDisabled = !tournamentData.tournamentName || !tournamentData.format ||
(tournamentData.format === 'groupAndKnockout' && !tournamentData.numberOfGroupStageLegs) ||
!tournamentData.numberOfParticipants;

  return (
    // create tournament form
    <div>
    <NavBar />
    <div className='container-fluid'>
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
          {/* submit button */}
          <div className='col-md-12'>
            <button className='btn btn-primary' disabled={ isSubmitDisabled }>
              Create Tournament
            </button>
          </div>
    
        </form>
      </div>
    </div>
  </div>
  )
}

export default CreateTournament;