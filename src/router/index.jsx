import React from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Layout from "../layout";
import Context from "../context";
import LoadingData from "../components/LoadingData";

import Login from "../pages/Login";
import Employees from "../pages/Employees";
import Orders from "../pages/Orders";
import Customers from "../pages/Customers";
import Products from "../pages/Products";
import VoiceMsg from "../pages/VoiceMsg";
import CollectionGroups from "../pages/CollectionGroups";
import Test from "../pages/Test";
import CollectionGroupsHistory from "../pages/collectionGroupsHistory";
import RouteOrders from "../pages/RouteOrders";


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
                <Route index element={<Navigate to="/orders" replace />} />
                <Route path="employees" element={<Employees />} />
                <Route path="orders" element={<Orders />} />
                <Route path="collection-groups" element={<CollectionGroups />} />
                <Route path="collection-groups-history" element={<CollectionGroupsHistory />} />
                <Route path="customers" element={<Customers />} />
                <Route path="products" element={<Products />} />
                <Route path="route-orders" element={<RouteOrders />} />
                <Route path="voice-msg" element={<VoiceMsg />} />
                <Route path="test" element={<Test />} />
            </Route>
        </Routes>
    )
};

export default ProjectRoutes;

