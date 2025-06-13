// 📝 NOTE: This is a DUPLICATE of the backend tournamentFunctions.js helpers

// This function allows access to the participant name and team name from the participant ID
export const participantLookupFunction = (participants = []) => {
    if (!Array.isArray(participants)) {
        console.warn("🛑 participantLookup called with non-array:", participants);
        return {};
    };

    return participants.reduce((acc, p) => {
        acc[p._id] = p;
        return acc;
    }, {});
}


