/**
 * Vercel Serverless Function: /api/leaderboard
 * Gestiona el ranking global y compartido de "Top Convertidores de Rafas"
 * Compatible con:
 * - Redis Oficial de Vercel (REDIS_URL via ioredis)
 * - Upstash / Vercel KV REST (KV_REST_API_URL / UPSTASH_REDIS_REST_URL)
 * - Fallback local resiliente
 */

const DEFAULT_LEADERBOARD = [
    { name: "Corchito Canelón 🐾", score: 8500, reverted: 28 },
    { name: "Kakarotta Streamer ⚡", score: 7200, reverted: 24 },
    { name: "Ralph con Capa 🦇", score: 5400, reverted: 18 },
    { name: "Fan de los Mates 🍵", score: 3900, reverted: 13 },
    { name: "Ex-Hater Revertido ✨", score: 2800, reverted: 9 }
];

let redisClient = null;

function getRedisClient() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return null;

    if (!redisClient) {
        try {
            const Redis = require('ioredis');
            redisClient = new Redis(redisUrl, {
                maxRetriesPerRequest: 1,
                connectTimeout: 5000,
                lazyConnect: true
            });
        } catch (e) {
            console.error('Error instanciando ioredis:', e);
            return null;
        }
    }
    return redisClient;
}

async function getStoredLeaderboard() {
    const redisUrl = process.env.REDIS_URL;
    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    // 1. Intentar con Redis oficial (REDIS_URL)
    if (redisUrl) {
        const client = getRedisClient();
        if (client) {
            try {
                if (client.status !== 'ready') {
                    await client.connect();
                }
                const data = await client.get('rafometro_leaderboard');
                if (data) {
                    return JSON.parse(data);
                }
            } catch (err) {
                console.error('Error leyendo con ioredis:', err);
            }
        }
    }

    // 2. Intentar con Upstash / Vercel KV REST API
    if (kvUrl && kvToken) {
        try {
            const resp = await fetch(`${kvUrl}/get/rafometro_leaderboard`, {
                headers: { Authorization: `Bearer ${kvToken}` }
            });
            const data = await resp.json();
            if (data && data.result) {
                return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
            }
        } catch (err) {
            console.error('Error leyendo con KV REST:', err);
        }
    }

    return null;
}

async function setStoredLeaderboard(leaderboard) {
    const redisUrl = process.env.REDIS_URL;
    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    // 1. Intentar con Redis oficial
    if (redisUrl) {
        const client = getRedisClient();
        if (client) {
            try {
                if (client.status !== 'ready') {
                    await client.connect();
                }
                await client.set('rafometro_leaderboard', JSON.stringify(leaderboard));
                return true;
            } catch (err) {
                console.error('Error guardando con ioredis:', err);
            }
        }
    }

    // 2. Intentar con KV REST
    if (kvUrl && kvToken) {
        try {
            await fetch(`${kvUrl}/set/rafometro_leaderboard`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${kvToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(leaderboard)
            });
            return true;
        } catch (err) {
            console.error('Error guardando con KV REST:', err);
        }
    }

    return false;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const isConnected = Boolean(
        process.env.REDIS_URL || 
        (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
        (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    );

    // 1. GET: Consultar ranking
    if (req.method === 'GET') {
        let board = await getStoredLeaderboard();

        if (!board || !Array.isArray(board) || board.length === 0) {
            board = DEFAULT_LEADERBOARD;
            if (isConnected) {
                await setStoredLeaderboard(board);
            }
        }

        return res.status(200).json({
            success: true,
            isLive: isConnected,
            leaderboard: board.slice(0, 10)
        });
    }

    // 2. POST: Registrar nueva puntuación
    if (req.method === 'POST') {
        try {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            let { name, score, reverted } = body || {};

            name = String(name || 'Anónimo')
                .replace(/<[^>]*>?/gm, '')
                .trim()
                .slice(0, 15);
            if (!name) name = 'Anónimo';

            score = parseInt(score, 10);
            reverted = parseInt(reverted, 10);

            if (isNaN(score) || score < 0) score = 0;
            if (isNaN(reverted) || reverted < 0) reverted = 0;
            if (score > 100000) score = 100000;

            let board = await getStoredLeaderboard();

            if (!board || !Array.isArray(board)) {
                board = [...DEFAULT_LEADERBOARD];
            }

            board.push({
                name,
                score,
                reverted,
                date: Date.now()
            });

            board.sort((a, b) => b.score - a.score);
            board = board.slice(0, 12);

            if (isConnected) {
                await setStoredLeaderboard(board);
            }

            return res.status(200).json({
                success: true,
                isLive: isConnected,
                leaderboard: board.slice(0, 10),
                savedEntry: { name, score, reverted }
            });

        } catch (err) {
            console.error('Error procesando score:', err);
            return res.status(500).json({
                success: false,
                error: 'Error interno al registrar la puntuación'
            });
        }
    }

    return res.status(405).json({ error: 'Método no permitido' });
};
