/**
 * Vercel Serverless Function: /api/history
 * Registra y consulta el historial privado de escaneos y comentarios en El Rafómetro.
 * Compatible con REDIS_URL, STORAGE_URL y Upstash REST.
 */

const ADMIN_PIN_DEFAULT = 'corchito2026';

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

async function getHistoryList() {
    // 1. Intentar con node-redis oficial
    const client = await getClient();
    if (client && client.isOpen) {
        try {
            const raw = await client.get('rafometro_history_scans');
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (err) {
            console.error('Error al hacer GET en Redis:', err);
        }
    }

    // 2. Intentar con KV REST
    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (kvUrl && kvToken) {
        try {
            const resp = await fetch(`${kvUrl}/get/rafometro_history_scans`, {
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

    return [];
}

async function setHistoryList(history) {
    const client = await getClient();
    if (client && client.isOpen) {
        try {
            await client.set('rafometro_history_scans', JSON.stringify(history));
            return true;
        } catch (err) {
            console.error('Error al hacer SET en Redis:', err);
        }
    }

    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (kvUrl && kvToken) {
        try {
            await fetch(`${kvUrl}/set/rafometro_history_scans`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${kvToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(history)
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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-pin');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const expectedPin = process.env.ADMIN_PIN || ADMIN_PIN_DEFAULT;

    // 1. GET: Consultar historial (Requiere PIN de seguridad)
    if (req.method === 'GET') {
        const providedPin = req.query.pin || req.headers['x-admin-pin'];

        if (!providedPin || providedPin !== expectedPin) {
            return res.status(401).json({
                success: false,
                error: 'PIN de acceso no válido o no proporcionado'
            });
        }

        const history = await getHistoryList();

        return res.status(200).json({
            success: true,
            totalScans: history.length,
            history
        });
    }

    // 2. POST: Registrar un nuevo escaneo desde la web
    if (req.method === 'POST') {
        try {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            let { comment, percentage, kiNumber, title, source } = body || {};

            if (!comment || typeof comment !== 'string') {
                return res.status(400).json({ success: false, error: 'Comentario vacío' });
            }

            // Sanitizar y limitar longitud
            comment = comment.replace(/<[^>]*>?/gm, '').trim().slice(0, 500);
            percentage = parseInt(percentage, 10) || 0;
            kiNumber = parseInt(kiNumber, 10) || 0;
            title = String(title || 'Escaneo Scouter').slice(0, 80);
            source = source === 'Captura OCR' ? 'Captura OCR' : 'Texto';

            const newEntry = {
                id: Date.now() + '-' + Math.random().toString(36).substring(2, 7),
                comment,
                percentage,
                kiNumber,
                title,
                source,
                timestamp: Date.now()
            };

            let history = await getHistoryList();
            if (!Array.isArray(history)) history = [];

            // Añadir al inicio y conservar los últimos 500 escaneos
            history.unshift(newEntry);
            if (history.length > 500) {
                history = history.slice(0, 500);
            }

            await setHistoryList(history);

            return res.status(200).json({
                success: true,
                savedId: newEntry.id
            });

        } catch (err) {
            console.error('Error guardando en historial:', err);
            return res.status(500).json({
                success: false,
                error: 'Error interno al registrar el historial'
            });
        }
    }

    return res.status(405).json({ error: 'Método no permitido' });
};
