import axios from "axios";
import { loadHeaderFooter } from "./utils.mjs";

const getAuthStatus = async ()  => {
    try {
        const response = await axios.get('/api/auth');
        console.log(response);
    }catch (err) {
        console.error(err);
    }
}

async function init(){
    await loadHeaderFooter();
    await getAuthStatus();
}

init();
