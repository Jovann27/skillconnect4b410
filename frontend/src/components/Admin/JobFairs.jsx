import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api";

const JobFairCreate = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("date", form.date);
      formData.append("time", form.time);
      formData.append("location", form.location);

      const data = await api.post("/admin/jobfairs", formData);
      if (data.data.success) {
        toast.success("Job fair created successfully!");
        setForm({ title: "", description: "", date: "", time: "", location: "" });
      } else {
        toast.error(data.data.message || "Failed to create job fair");
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Create Job Fair</h1>
        <p>Set up a new job fair event</p>
      </div>
      <div className="analytics-card">
        <form onSubmit={handleSubmit}>
          <div>
            <label className="block font-medium">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              rows="3"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Time</label>
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Location</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              autoComplete="address-level2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="refresh-btn"
          >
            {loading ? "Creating..." : "Create Job Fair"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JobFairCreate;
