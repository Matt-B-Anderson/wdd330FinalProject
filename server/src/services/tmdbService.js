export async function checkAuthStatus() {
    const token = process.env.TMDB_API_KEY;
    try {
        const response = await axios.get('https://api.themoviedb.org/3/authentication', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log(response.data);
    } catch (err) {
        console.error('Error checking auth status: ', err.response?.status, err.message);
    }
}