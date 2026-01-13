import "./App.css";
import {  Routes, Route } from "react-router";

import Login from "./pages/authPages/login";
import Register from "./pages/authPages/register";
import Dashboard from "./pages/dashboardPage/dashboard";
// import ViewPage from "./pages/viewPage/viewPage"
import ProtectedRoute from "./Routes/protectedRoute";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Register" element={<Register />} />

        <Route
          path="/Dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
              </ProtectedRoute>

          }
        />
        {/* <Route path="/view/:id" element={<ViewPage />} />  */}


      </Routes>
  );
}

export default App;