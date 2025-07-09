const { default: axios } = require("axios");

const BASE_NBS_URL = "https://sales-v2.nbs-app.net/api/crm/"



const getNbsToken = async () => {
    console.log('🔐 Starting authentication process...');

    const userName = "naftali";
    const password = "naftali2015";
    // const userName = process.env.NBS_USERNAME;
    // const password = process.env.NBS_PASSWORD;

    if (!userName || !password) {
        console.error('❌ NBS credentials are missing from environment variables');
        throw new Error('NBS credentials are not set in environment variables');
    }

    let data = JSON.stringify({
        "email": userName,
        "username": userName,
        "password": password
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: BASE_NBS_URL + 'auth/login/',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://crm.shoppi.co.il',
            'Referer': 'https://crm.shoppi.co.il/',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-Mode': 'cors',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
            'Content-Type': 'application/json'
        },
        data: data
    };

    try {
        const res = await axios.request(config);

        if (res.status !== 200 || res.data.status !== 'success') {
            console.error('❌ Authentication failed:', res.status, res.statusText);
            throw new Error(`Failed to get token: ${res.status} ${res.statusText}`);
        }

        console.log('🎉 Authentication successful! Token received.');
        return res.data.data.access;

    } catch (error) {
        console.error('💥 Error during authentication:', error.message);
        if (error.response) {
            console.error('📥 Error response status:', error.response.status);
            console.error('📥 Error response data:', error.response.data);
        }
        throw error;
    }
}

//exportType = detailed | basic | weights
const getNbsOrders = async (token, filters, exportType) => {

    console.log('📦 Fetching orders with filters:', filters);
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${BASE_NBS_URL}order/report/export-xlsx/?filters=${filters}&sort=%7B%22sortBy%22:%22%22,%22sortDir%22:%22desc%22%7D&exportType=${exportType}`,
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://crm.shoppi.co.il',
            'Referer': 'https://crm.shoppi.co.il/',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-Mode': 'cors',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
            'Authorization': 'Bearer ' + token
        },
        responseType: 'arraybuffer'  // Important: Handle binary Excel data
    };

    try {
        const res = await axios.request(config);

        if (res.status !== 200) {
            console.error('❌ Failed to fetch orders:', res.status, res.statusText);
            throw new Error(`Failed to get orders: ${res.status} ${res.statusText}`);
        }

        console.log('✅ Orders data received successfully');
        return res.data;

    } catch (error) {
        console.error('💥 Error fetching orders:', error.message);
        if (error.response) {
            console.error('📥 Error response status:', error.response.status);
            console.error('📥 Error response headers:', error.response.headers);
        }
        throw error;
    }
}


const getNbsCustomers = async (token, filters) => {
    //%7B%22searchTerm%22:%22%22,%22saleIds%22:[],%22branchIds%22:[],%22createdRange%22:null,%22updatedRange%22:null,%22status%22:[%22active%22]%7D
    console.log('📦 Fetching orders with filters:', filters);
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${BASE_NBS_URL}customer/export-xlsx/?filters=${filters}&sort=%7B%22sortBy%22:%22%22,%22sortDir%22:%22desc%22%7D&exportType=${exportType}`,
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://crm.shoppi.co.il',
            'Referer': 'https://crm.shoppi.co.il/',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-Mode': 'cors',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
            'Authorization': 'Bearer ' + token
        },
        responseType: 'arraybuffer'  // Important: Handle binary Excel data
    };


    try {
        const res = await axios.request(config);

        if (res.status !== 200) {
            console.error('❌ Failed to fetch orders:', res.status, res.statusText);
            throw new Error(`Failed to get orders: ${res.status} ${res.statusText}`);
        }

        console.log('✅ Orders data received successfully');
        return res.data;

    } catch (error) {
        console.error('💥 Error fetching orders:', error.message);
        if (error.response) {
            console.error('📥 Error response status:', error.response.status);
            console.error('📥 Error response headers:', error.response.headers);
        }
        throw error;
    }
}


module.exports = {
    getNbsToken,
    getNbsOrders,
    getNbsCustomers
}