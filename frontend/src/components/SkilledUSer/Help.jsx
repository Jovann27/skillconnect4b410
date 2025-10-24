const UserHelp = () => {
  const handleContact = () => {
    window.location.href = "mailto:support@skillconnect.com";
  };

  return (
    <div className="tab-container">
      <h2>Help & Support</h2>
      <p>If you need assistance, contact our support team.</p>
      <button onClick={handleContact}>Contact Support</button>
    </div>
  );
};

export default UserHelp;
