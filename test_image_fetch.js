const https = require('https');
async function test() {
    try {
        const response = await fetch("https://via.placeholder.com/150");
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log("Success:", buffer.length);
    } catch(e) {
        console.error("Error:", e);
    }
}
test();
