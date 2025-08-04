import * as tmdb from '../services/tmdbService';

export async function auth(req, res, next) {
    try {
        const status = await tmdb.checkAuthStatus();
        res.json(status);
    } catch (err) {
        
    }
}