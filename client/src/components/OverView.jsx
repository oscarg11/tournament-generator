import React, {useState} from 'react'
import { useOutletContext } from 'react-router-dom'
import axios from 'axios'

export const OverView = () => {
    const { tournamentData, setTournamentData } = useOutletContext();

    // errors state
    const [errors, setErrors] = useState({});

    // Temporary state for current participant
    const [currentParticipant, setCurrentParticipant] = useState({
      participantName: '',
      teamName: ''
    });

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
  const handleAddParticipant = async () => {
    let localErrors = {};
    
    // Validate participant details
    if (!currentParticipant.participantName || currentParticipant.participantName.length < 2) {
      localErrors.participantName = { message: "A name is required and must be at least 2 characters." };
    }
    if (!currentParticipant.teamName || currentParticipant.teamName.length < 2) {
      localErrors.teamName = { message: "Team name is required and must be at least 2 characters." };
    }
  
    // If there are errors, set them and return, If not clear errors
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }else{
      setErrors('');
    }
    try {
      await axios.patch(
        `http://localhost:8000/api/tournaments/${tournamentData._id}/add-participant`,
        currentParticipant
      )
      console.log('Participant added successfully');
      // Add participant locally to the tournamentData object
      setTournamentData(prevData => ({
        ...prevData,
        participants: [...prevData.participants, currentParticipant],
      }));
    
      // Clear current participant form
      setCurrentParticipant({ participantName: '', teamName: '' });
      
    } catch (error) {
        console.error("❌Error Updating Tournament with Participant:", error.response?.data || error.message || error);
    }
  };
  ;
  

  // Delete participant
  const handleDeleteParticipant = index => {
    //clear any existing errors
    if(tournamentData.participants.length <= parseInt(tournamentData.numberOfParticipants)){
      setErrors(prevErrors => ({
        ...prevErrors,
        incompleteParticipants: ''
      }))
    }
    setTournamentData(prevData => ({
      ...prevData,
      participants: prevData.participants.filter((_, i) => i !== index)
    }));
  };

//   const handleConfirm = (e) => {
//     e.preventDefault()
//     // Validate that all participants are complete
//     if(tournamentData.participants.length < parseInt(tournamentData.numberOfParticipants)){
//       setErrors(prevErrors => ({
//         ...prevErrors,
//         incompleteParticipants: 'Please complete all participants'
//       }))
//       return;
//     }else if(tournamentData.participants.length > parseInt(tournamentData.numberOfParticipants)){
//       setErrors(prevErrors => ({
//         ...prevErrors,
//         incompleteParticipants: 'Too many participants'
//       }))
//       return;
//     }
//     axios.patch(`http://localhost:8000/api/tournaments/${tournamentData._id}/update-tournament`, tournamentData)
//       .then(res => {
//         console.log(res, 'Tournament UPDATED successfully!');
        
//         setErrors({});
//       })
//       .catch(err => {
//         if (err.response && err.response.data && err.response.data.error && err.response.data.error.errors) {
//             //Validation error handling
//             console.error('Validation Errors:', err.response.data.error.errors);
//             setErrors(err.response.data.error.errors);
//         } else {
//             //General error handling
//             console.error('Submission error:', err);
//             setErrors({ general: 'An error occurred. Please try again.' });
//         }
//     });
// };

    
  return (
    <div className="container-fluid">
      {/* Tournament Details */}
      <div className="container py-5">
        <h2>Tournament Details</h2>
        <div className="form-group mb-3">
          <h3>Tournament Name: { tournamentData.tournamentName }</h3>
          <h3>Format: { tournamentData.format }</h3>
          <h3>Number of Participants: { tournamentData.numberOfParticipants }</h3>

          <h3>Participants:</h3>
          {/* Display list of participants in a scrollable box */}
          <div style={{ maxHeight: "1000px", overflowY: "scroll" }}>
            {}
            {/* Incomplete participants validtation message */}
            {errors.incompleteParticipants && <p className="text-danger">{errors.incompleteParticipants}</p>}
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
      </div>
      <div className="container py-5">
        <h1>Add Participants</h1>
        <form action="" onSubmit={ handleAddParticipant }>
          <div className="form-group mb-3">

            {/* Participant Name */}
            { errors.participantName ? <p className="text-danger">{errors.participantName.message}</p> : "" }
            <label htmlFor="participantName">Participant's Name:</label>
            <input
              type="text"
              className="form-control"
              id="participantName"
              placeholder="Enter Participant's Name"
              name='participantName' 
              value={currentParticipant.participantName}
              onChange={onChangeHandler}/>
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
            <button type="button"
                    className='btn btn-success mt-2'
                    onClick={handleAddParticipant}>
                    Add New Participant
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default OverView;