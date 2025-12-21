import React, {useState} from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import axios from 'axios'

export const OverView = () => {
    const { tournamentData, setTournamentData } = useOutletContext();

    const navigate = useNavigate();

    // errors state
    const [errors, setErrors] = useState({});

    //start tournament button loading state
    const [isStarting, setIsStarting] = useState(false);

    // Temporary state for current participant
    const [currentParticipant, setCurrentParticipant] = useState({
      participantName:'',
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
    }
    try {
      const res =await axios.patch(
        `http://localhost:8000/api/tournaments/${tournamentData._id}/add-participant`,
        currentParticipant
      )
      //only clears errors on success
      setErrors({});
      console.log('Participant added successfully');

      //update tournament data with new participant
      setTournamentData(res.data.tournament)
      console.log("Updated Tournament Data After adding one participant:", res.data.tournament);

      // Clear current participant form
      setCurrentParticipant({ participantName: '', teamName: '' });
      
    } catch (error) {
      const backendErrors = error.response?.data?.message;

      if (backendErrors){
        setErrors({
          numberOfParticipants: { message: backendErrors }
        });
      }else{
        setErrors({ general: 'An error occurred. Please try again.' });
        console.error("❌Error Updating Tournament with Participant:", error.response?.data || error.message || error);
      }
    }
  };
  

  // Delete participant
  const handleDeleteParticipant = async (participantId) => {
    //clear any existing errors
    if(tournamentData.participants.length <= parseInt(tournamentData.numberOfParticipants)){
      setErrors(prevErrors => ({
        ...prevErrors,
        incompleteParticipants: ''
      }))
    }
    try {
      const res = await axios.delete(
        `http://localhost:8000/api/tournaments/${tournamentData._id}/delete-participant/${participantId}`,
      )
      console.log("participantId arg:", participantId);

      setTournamentData(res.data.tournament);
      console.log("Updated Tournament Data After Deleting one participant:", res.data.tournament);
    } catch (error) {
      console.error("❌Error Deleting Participant from Tournament:", error.response?.data || error.message || error);
    }
    
  };

//START TOURNAMENT
    const handleStartTournament = async () => {
      console.log("🟢 handleStartTournament triggered");

      if(tournamentData.status === 'started'){
        alert("Tournament has already started.");
        return;
      }

      //check if all participants have been added
      if(tournamentData.participants.length < parseInt(tournamentData.numberOfParticipants)){
        setErrors(prevErrors => ({
          ...prevErrors,
          incompleteParticipants: `You need to add all ${tournamentData.numberOfParticipants} participants before starting the tournament.`
        }))
        return;
      }
      //check if participants exceed the limit
      if(tournamentData.participants.length > parseInt(tournamentData.numberOfParticipants)){
        setErrors(prevErrors => ({
          ...prevErrors,
          incompleteParticipants: `You have exceeded the number of participants (${tournamentData.numberOfParticipants}). Please remove the extra participants before starting the tournament.`
        }))
        return;
      }

      const confirmStart = window.confirm("Are you sure you want to start the tournament? This action cannot be undone.");
      if(!confirmStart) return;
      try {
        //loading indicator
        setIsStarting(true);

        await axios.patch(
          `http://localhost:8000/api/tournaments/${tournamentData._id}/start-tournament`,
          tournamentData
        );

        navigate(`/dashboard/${tournamentData._id}/group-stage/matches`);
        console.log("Tournament started successfully!");
        setErrors({});
      } catch (error) {
        console.error("Error concluding group stage:", error);
        alert("Error concluding group stage. Please try again.");
      }finally{
        setIsStarting(false);
      }
    }

    
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
            {tournamentData.participants.map((participant) => (
            <li key={participant._id} style={{ marginBottom: '10px', color: 'black' }}>
              {/* Display the participant's name and team name */}
              {`${participant.participantName} (${participant.teamName})`}

              {/* Delete button for each participant */}
              <button className='btn btn-danger'
              onClick = {() => {
                console.log(`🗑️ Deleting Participant: "${participant.participantName}" from tournament`);
                handleDeleteParticipant(participant._id);
              }}
              style={{ marginLeft: "10px" }}>
                Delete
              </button>
            </li>
            ))}
            </ol>
          </div>
          </div>
          {/* Start Tournament Button */}
          <button onClick={handleStartTournament} disabled={isStarting} className="btn btn-primary">
            Start Tournament
          </button>
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
            {/* max number of participants error */}
      
            {errors.numberOfParticipants ? <p className="text-danger">{errors.numberOfParticipants.message}</p> : ""}
    
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