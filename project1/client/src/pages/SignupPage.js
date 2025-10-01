import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, TextField, Button, Typography, Alert, Box, MenuItem } from "@mui/material";
import api from "../api";

function SignupPage() {
  const [form, setForm] = useState({ username: "", password: "", role: "user" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, p: 4, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h5" mb={2}>Sign Up</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <form onSubmit={handleSignup}>
          <TextField label="Username" name="username" fullWidth margin="normal" value={form.username} onChange={handleChange} />
          <TextField label="Password" name="password" type="password" fullWidth margin="normal" value={form.password} onChange={handleChange} />
          <TextField
            select
            label="Role"
            name="role"
            fullWidth
            margin="normal"
            value={form.role}
            onChange={handleChange}
          >
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Register</Button>
        </form>
        <Button onClick={() => navigate("/login")} sx={{ mt: 2 }}>Already have an account? Login</Button>
      </Box>
    </Container>
  );
}

export default SignupPage;
