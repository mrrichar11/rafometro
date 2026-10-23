/**
 * Vercel Serverless Function: /api/leaderboard
 * Gestiona el ranking global y compartido de "Top Convertidores de Rafas"
 * Compatible con Vercel KV (Upstash Redis REST API) con fallback resiliente.
 */

const DEFAULT_LEADERBOARD = [
    { name: "Corchito Canelón 🐾", score: 8500, reverted: 28 },
    { name: "Kakarotta Streamer ⚡", score: 7200, reverted: 24 },
    { name: "Ralph con Capa 🦇", score: 5400, reverted: 18 },
    { name: "Fan de los Mates 🍵", score: 3900, reverted: 13 },
    { name: "Ex-Hater Revertido ✨", score: 2800, reverted: 9 }
];

module.exports = async (req, res) => {
    // Configuración CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    // Helper para interactuar con Upstash / Vercel KV REST
    async function getKvLeaderboard() {
        if (!kvUrl || !kvToken) return null;
        try {
            const resp = await fetch(`${kvUrl}/get/rafometro_leaderboard`, {
                headers: { Authorization: `Bearer ${kvToken}` }
            });
            const data = await resp.json();
            if (data && data.result) {
                return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
            }
            return null;
        } catch (err) {
            console.error('Error al leer KV:', err);
            return null;
        }
    }

    async function setKvLeaderboard(leaderboard) {
        if (!kvUrl || !kvToken) return false;
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
            console.error('Error al guardar en KV:', err);
            return false;
        }
    }

    // 1. GET: Consultar el ranking global actual
    if (req.method === 'GET') {
        let board = await getKvLeaderboard();
        const isLive = Boolean(kvUrl && kvToken);

        if (!board || !Array.isArray(board) || board.length === 0) {
            board = DEFAULT_LEADERBOARD;
            if (isLive) {
                await setKvLeaderboard(board);
            }
        }

        return res.status(200).json({
            success: true,
            isLive,
            leaderboard: board.slice(0, 10)
        });
    }

    // 2. POST: Registrar una nueva puntuación en la nube
    if (req.method === 'POST') {
        try {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            let { name, score, reverted } = body || {};

            // Sanitización
            name = String(name || 'Anónimo')
                .replace(/<[^>]*>?/gm, '')
                .trim()
                .slice(0, 15);
            if (!name) name = 'Anónimo';

            score = parseInt(score, 10);
            reverted = parseInt(reverted, 10);

            if (isNaN(score) || score < 0) score = 0;
            if (isNaN(reverted) || reverted < 0) reverted = 0;
            if (score > 100000) score = 100000; // Límite de seguridad anti-trampas

            let board = await getKvLeaderboard();
            const isLive = Boolean(kvUrl && kvToken);

            if (!board || !Array.isArray(board)) {
                board = [...DEFAULT_LEADERBOARD];
            }

            // Agregar el nuevo puntaje
            board.push({
                name,
                score,
                reverted,
                date: Date.now()
            });

            // Ordenar de mayor a menor y mantener el top 12
            board.sort((a, b) => b.score - a.score);
            board = board.slice(0, 12);

            if (isLive) {
                await setKvLeaderboard(board);
            }

            return res.status(200).json({
                success: true,
                isLive,
                leaderboard: board.slice(0, 10),
                savedEntry: { name, score, reverted }
            });

        } catch (err) {
            console.error('Error procesando score:', err);
            return res.status(500).json({
                success: false,
                error: 'Error interno al guardar la puntuación'
            });
        }
    }

    return res.status(405).json({ error: 'Método no permitido' });
};
