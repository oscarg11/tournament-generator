import React, {useState} from 'react'
import axios from 'axios'

const TournamentForm = () => {
  const [tournamentData, setTournamentData] = useState({
    tournamentName: '',
    format: '',
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
        <div className="form-group">
        { errors.tournamentName ? <p className="text-danger">{errors.tournamentName.message}</p> : "" }
          <label htmlFor="tournamentName">Tournament Name:</label>
          <input type="text" className="form-control" id="tournamentName"
          placeholder="Enter Tournament Name" name='tournamentName' onChange={ onChangeHandler}/>
        </div>
        {/* Format */}

        <button className='btn btn-primary'>Create Tournament</button>
      </form>
    </div>
  )
}

export default TournamentForm;