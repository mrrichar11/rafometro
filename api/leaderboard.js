/**
 * Vercel Serverless Function: /api/leaderboard
 * Gestiona el ranking global y compartido de "Top Convertidores de Rafas"
 * Utiliza la integración oficial de Redis para Vercel (node-redis / REDIS_URL)
 */

const DEFAULT_LEADERBOARD = [
    { name: "Corchito Canelón 🐾", score: 8500, reverted: 28 },
    { name: "Kakarotta Streamer ⚡", score: 7200, reverted: 24 },
    { name: "Ralph con Capa 🦇", score: 5400, reverted: 18 },
    { name: "Fan de los Mates 🍵", score: 3900, reverted: 13 },
    { name: "Ex-Hater Revertido ✨", score: 2800, reverted: 9 }
];

let cachedClient = null;

async function getClient() {
    const redisUrl = process.env.REDIS_URL || process.env.STORAGE_URL;
    if (!redisUrl) return null;

    if (cachedClient && cachedClient.isOpen) {
        return cachedClient;
    }

    try {
        const { createClient } = require('redis');
        cachedClient = createClient({
            url: redisUrl,
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: (retries) => (retries > 2 ? false : 500)
            }
        });

        cachedClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        await cachedClient.connect();
        return cachedClient;
    } catch (e) {
        console.error('Error conectando con node-redis:', e);
        return null;
    }
}

async function getStoredLeaderboard() {
    // 1. Intentar con node-redis oficial (REDIS_URL / STORAGE_URL)
    const client = await getClient();
    if (client && client.isOpen) {
        try {
            const raw = await client.get('rafometro_leaderboard');
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (err) {
            console.error('Error al hacer GET en Redis:', err);
        }
    }

    // 2. Intentar con KV REST si estuviera configurado
    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (kvUrl && kvToken) {
        try {
            const resp = await fetch(`${kvUrl}/get/rafometro_leaderboard`, {
                headers: { Authorization: `Bearer ${kvToken}` }
            });
            const data = await resp.json();
            if (data && data.result) {
                return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
            }
        } catch (e) {
            console.error('Error con KV REST:', e);
        }
    }

    return null;
}

async function setStoredLeaderboard(leaderboard) {
    const client = await getClient();
    if (client && client.isOpen) {
        try {
            await client.set('rafometro_leaderboard', JSON.stringify(leaderboard));
            return true;
        } catch (err) {
            console.error('Error al hacer SET en Redis:', err);
        }
    }

    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
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
        } catch (e) {
            console.error('Error guardando en KV REST:', e);
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
        process.env.STORAGE_URL ||
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
