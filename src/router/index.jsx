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
import Suppliers from "../pages/Suppliers";
import Invoices from "../pages/Invoices";
import RouteOrders from "../pages/RouteOrders";
import Report from "../pages/Reports";
import Rentals from "../pages/Rentals";
import Devices from "../pages/Devices";
import Expenses from "../pages/Expenses";
import Revenues from "../pages/Revenues";
import ILNumbers from "../pages/Il-numbers";


const ProjectRoutes = () => {

    const { user } = React.useContext(Context)

    const navigate = useNavigate()
    const path = useLocation().pathname;
    React.useEffect(() => {
        if (user === null && path !== '/login') {
            navigate('/login')
        }
    }, [user, path])

    if (user === 'loading' && path !== '/login') return <LoadingData />

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />} >
                <Route index element={<Navigate to="/rentals" replace />} />
                <Route path="employees" element={<Employees />} />
                <Route path="orders" element={<Orders />} />
                <Route path="collection-groups" element={<CollectionGroups />} />
                <Route path="collection-groups-history" element={<CollectionGroupsHistory />} />
                <Route path="customers" element={<Customers />} />
                <Route path="products" element={<Products />} />
                <Route path="route-orders" element={<RouteOrders />} />
                <Route path="voice-msg" element={<VoiceMsg />} />
                <Route path="test" element={<Test />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="reports" element={<Report />} />

                <Route path="rentals" element={<Rentals />} />
                <Route path="rentals-history" element={<Rentals />} />
                <Route path="devices" element={<Devices />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="revenues" element={<Revenues />} />
                <Route path="il-numbers" element={<ILNumbers />} />

                {/* <Route path="mistake-orders" element={<MistakeOrders />} /> */}
            </Route>
        </Routes>
    )
};

export default ProjectRoutes;

