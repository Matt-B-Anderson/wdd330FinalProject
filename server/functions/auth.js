import axios from 'axios';
import 'dotenv/config';

export async function handler(event, context) {
  const token = process.env.TMDB_API_KEY;
  try {
    const response = await axios.get(
      'https://api.themoviedb.org/3/authentication/token/new',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (err) {
    return {
      statusCode: err.response?.status || 500,
      body: JSON.stringify({ message: err.message })
    };
  }
}