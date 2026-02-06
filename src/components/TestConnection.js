import React, { useEffect, useState } from 'react';

const TestConnection = () => {
  const [status, setStatus] = useState('Testing...');
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const testLocalStorage = () => {
      try {
        const teams = JSON.parse(localStorage.getItem('teams') || '[]');
        setTeams(teams);
        setStatus(`Connected! Found ${teams.length} teams in localStorage`);
      } catch (error) {
        setStatus(`Error: ${error.message}`);
      }
    };

    testLocalStorage();
  }, []);

  return (
    <div style={{ padding: '20px', background: 'var(--bg-secondary)', margin: '20px', borderRadius: '8px' }}>
      <h3>LocalStorage Connection Test</h3>
      <p>Status: {status}</p>
      {teams.length > 0 && (
        <div>
          <h4>Teams:</h4>
          {teams.map((team, index) => (
            <p key={index}>#{team.slotNumber} - {team.teamName}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestConnection;