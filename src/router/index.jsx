import React from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Layout from "../layout";
import Context from "../context";
import LoadingData from "../components/LoadingData";

import Login from "../pages/Login";
import Employees from "../pages/Employees";
import Orders from "../pages/Orders";
import VoiceMsg from "../pages/VoiceMsg";


const ProjectRoutes = () => {

    const { user } = React.useContext(Context)

    const navigate = useNavigate()
    const path = useLocation().pathname;
    React.useEffect(() => {
        if (user == null && path != '/login') {
            navigate('/login')
        }
    }, [user, path])

    if (user == 'loading' && path != '/login') return <LoadingData />

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />} >
                <Route path="employees" element={<Employees />} />
                <Route path="orders" element={<Orders />} />
                <Route path="voice-msg" element={<VoiceMsg />} />

            </Route>
        </Routes>
    )
};

export default ProjectRoutes;

