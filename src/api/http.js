import axios from 'axios'
// xJYOeS(-mZGh
const BASE_URL = 'https://us-central1-k-tzdaka.cloudfunctions.net/';


export default {
    get(endpoint, data) {
        return ajax(endpoint, 'GET', data)
    },
    post(endpoint, data) {
        return ajax(endpoint, 'POST', data)
    },
    put(endpoint, data) {
        return ajax(endpoint, 'PUT', data)
    },
    delete(endpoint, data) {
        return ajax(endpoint, 'DELETE', data)
    }
}

async function ajax(endpoint, method = 'get', data = null) {
    // console.log(`API -- ${BASE_URL}${endpoint}`);
    // console.log('*******************************************************************************');
    try {
        const res = await axios({
            url: `${BASE_URL}${endpoint}`,
            method,
            data,
            params: (method === 'GET') ? data : null
        });
        return res.data;
    } catch (err) {
        // console.log(`Had Issues ${method}ing to the backend, endpoint: ${endpoint}, with data: ${data}`);
        // console.dir(err);
        // console.log("ERROR MESSAGE:");
        // console.log(err.response.data.title);
        // console.log("**************");
        throw err;
    }
}