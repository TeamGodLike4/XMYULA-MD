import express from 'express';
import { createServer } from 'http';
import { toBuffer } from 'qrcode';
import fetch from 'node-fetch';

function connect(conn) {
    const app = express();
    const server = createServer(app);
    const PORT = process.env.PORT || 3000;
    let _qr = 'invalid';

    conn.ev.on('connection.update', ({ qr }) => {
        if (qr) _qr = qr;
    });

    app.get('/', async (req, res) => {
        try {
            res.setHeader('content-type', 'image/png');
            res.end(await toBuffer(_qr));
        } catch (error) {
            console.error('Error generating QR code:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    server.listen(PORT, () => {
        console.log('App is listening on port', PORT);
        if (process.env.KEEPALIVE) keepAlive();
    });
}

function pipeEmit(event, event2, prefix = '') {
    const oldEmit = event.emit;
    event.emit = function (event, ...args) {
        oldEmit.call(event, event, ...args);
        event2.emit(prefix + event, ...args);
    };
    return {
        unpipeEmit() {
            event.emit = oldEmit;
        }
    };
}

function keepAlive() {
    const url = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    if (/(\/\/|\.)undefined\./.test(url)) return;
    setInterval(() => {
        fetch(url).catch(console.error);
    }, 5 * 1000 * 60);
}

export default connect;
