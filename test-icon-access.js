const http = require('http');

// URL to test (from the issue description)
const url = 'http://localhost:3002/azure/icon/storage-accounts?size=64';

console.log(`Testing access to ${url} without API token...`);

// Make a GET request to the URL
http.get(url, (res) => {
  const { statusCode } = res;
  const contentType = res.headers['content-type'];

  console.log(`Status Code: ${statusCode}`);
  console.log(`Content Type: ${contentType}`);

  let error;
  if (statusCode !== 200) {
    error = new Error(`Request Failed.\nStatus Code: ${statusCode}`);
  } else if (!/^image\/svg\+xml/.test(contentType)) {
    error = new Error(`Invalid content-type.\nExpected image/svg+xml but received ${contentType}`);
  }

  if (error) {
    console.error(error.message);
    // Consume response data to free up memory
    res.resume();
    return;
  }

  res.setEncoding('utf8');
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    try {
      // Check if the response starts with an SVG tag
      if (rawData.trim().startsWith('<svg')) {
        console.log('Success! Received SVG content without API token.');
        console.log(`SVG content length: ${rawData.length} characters`);
      } else {
        console.error('Error: Response does not appear to be SVG content.');
        console.log('Response:', rawData);
      }
    } catch (e) {
      console.error('Error parsing response:', e.message);
    }
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});