import { useState, useEffect } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useMainContext } from "../../mainContext";

const UserSettings = () => {
  const { user: currentUser } = useMainContext();
  const [user, setUser] = useState({ firstName: "", lastName: "", email: "", phone: "" });

  useEffect(() => {
    if (currentUser) {
      setUser({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
      });
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      await api.put("/user/update-profile", user);
      toast.success("Settings updated!");
    } catch {
      toast.error("Failed to update settings");
    }
  };

  return (
    <div className="tab-container">
      <h2>Settings</h2>
      <label>First Name</label>
      <input
        type="text"
        value={user.firstName}
        onChange={(e) => setUser({ ...user, firstName: e.target.value })}
      />
      <label>Last Name</label>
      <input
        type="text"
        value={user.lastName}
        onChange={(e) => setUser({ ...user, lastName: e.target.value })}
      />
      <label>Email</label>
      <input
        type="email"
        value={user.email}
        onChange={(e) => setUser({ ...user, email: e.target.value })}
      />
      <label>Phone</label>
      <input
        type="text"
        value={user.phone}
        onChange={(e) => setUser({ ...user, phone: e.target.value })}
      />
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default UserSettings;
