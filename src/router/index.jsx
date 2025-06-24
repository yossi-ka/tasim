import React from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Layout from "../layout";
import Context from "../context";
import LoadingData from "../components/LoadingData";

import Login from "../pages/Login";


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
                {/* <Route path="" element={<Navigate to="/a" />} /> */}
               
            </Route>
        </Routes>
    )
};

export default ProjectRoutes;

