
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
};

const CONCURRENCY = 50;
const TOTAL_REQUESTS = 500;
let completed = 0;
let errors = 0;
let start = Date.now();

console.log(`Starting stress test: ${TOTAL_REQUESTS} requests with concurrency ${CONCURRENCY}...`);

function makeRequest() {
    if (completed >= TOTAL_REQUESTS) return;

    const req = http.request(options, (res) => {
        res.on('data', () => { });
        res.on('end', () => {
            completed++;
            if (completed % 50 === 0) process.stdout.write('.');
            if (completed < TOTAL_REQUESTS) makeRequest();
            else finish();
        });
    });

    req.on('error', (e) => {
        errors++;
        completed++;
        if (completed < TOTAL_REQUESTS) makeRequest();
        else finish();
    });

    req.end();
}

for (let i = 0; i < CONCURRENCY; i++) {
    makeRequest();
}

function finish() {
    const duration = (Date.now() - start) / 1000;
    console.log(`\n\nTest finished in ${duration.toFixed(2)}s`);
    console.log(`Requests per second: ${(TOTAL_REQUESTS / duration).toFixed(2)}`);
    console.log(`Errors: ${errors}`);
}
