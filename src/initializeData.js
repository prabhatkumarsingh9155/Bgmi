// Add sample data to localStorage
const addSampleData = () => {
  try {
    const sampleTeams = [
      {
        teamName: "Soul Esports",
        slotNumber: 1,
        captainWhatsapp: "9876543210",
        email: "soul@example.com",
        player1Name: "Mortal", player1Id: "512345678",
        player2Name: "Viper", player2Id: "512345679",
        player3Name: "Clutchgod", player3Id: "512345680",
        player4Name: "Owais", player4Id: "512345681",
        status: "pending",
        createdAt: new Date().toISOString()
      },
      {
        teamName: "TSM Entity",
        slotNumber: 2,
        captainWhatsapp: "9876543211",
        email: "tsm@example.com",
        player1Name: "Ghatak", player1Id: "512345682",
        player2Name: "Zgod", player2Id: "512345683",
        player3Name: "Neyoo", player3Id: "512345684",
        player4Name: "Abhijeet", player4Id: "512345685",
        status: "approved",
        createdAt: new Date().toISOString()
      }
    ];
    
    localStorage.setItem('teams', JSON.stringify(sampleTeams));
    
    // Add sample notification
    const sampleNotification = {
      title: "Tournament Registration Open!",
      message: "BGMI Tournament Season 1 registration is now live. Register your squad now!",
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('notifications', JSON.stringify([sampleNotification]));
    
    alert("Sample teams added to localStorage!");
    window.location.reload(); // Refresh to show data
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
};

export default addSampleData;