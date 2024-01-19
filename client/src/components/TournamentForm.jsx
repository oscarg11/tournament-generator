import React, {useState} from 'react'
import axios from 'axios'

const TournamentForm = () => {
  const [tournamentData, setTournamentData] = useState({
    tournamentName: '',
    format: '',
    numberOfGroups: '',
    numberOfMatches:'',
    numberOfParticipants: '',
    participants: [{ firstName: '', lastName: '', teamName: '' }]
  });


  const onChangeHandler = (e) => {
    setTournamentData({
      ...tournamentData,
      [e.target.name]: e.target.value
    });
  }


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
        {/* Conditionally render Number of Groups Dropdown */}
        {tournamentData.format === 'groupAndKnockout' && (
          <div className="form-group mb-3">
            <label htmlFor="numberOfGroups">Number of Groups:</label>
            <select
              className="form-select"
              id="numberOfGroups"
              name="numberOfGroups"
              onChange={onChangeHandler}
              value={tournamentData.numberOfGroups}
            >
              <option value="">Select Number of Groups</option>
              {/* Add options for number of groups here */}
              <option value="2">2</option>
            </select>
          </div>
        )}

        {/* Number of Participants */}

        <button className='btn btn-primary'>Create Tournament</button>
      </form>
    </div>
  )
}

export default TournamentForm;