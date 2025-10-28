import React from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Layout from "../layout";
import Context from "../context";
import LoadingData from "../components/LoadingData";
import Login from "../pages/Login";
import Rentals from "../pages/Rentals";
import Devices from "../pages/Devices";
import Expenses from "../pages/Expenses";
import Revenues from "../pages/Revenues";
import ILNumbers from "../pages/Il-numbers";
import Settings from "../pages/Settings"


const ProjectRoutes = () => {

    const { user } = React.useContext(Context)

    const navigate = useNavigate()
    const path = useLocation().pathname;
    React.useEffect(() => {
        if (user === null && path !== '/login') {
            navigate('/login')
        }
    }, [user, path, navigate])

    if (user === 'loading' && path !== '/login') return <LoadingData />

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />} >
                <Route index element={<Navigate to="/rentals" replace />} />
                <Route path="rentals" element={<Rentals />} />
                <Route path="rentals-history" element={<Rentals />} />
                <Route path="devices" element={<Devices />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="revenues" element={<Revenues />} />
                <Route path="il-numbers" element={<ILNumbers />} />
                <Route path="settings" element={<Settings />} />

            </Route>
        </Routes>
    )
};

export default ProjectRoutes;

