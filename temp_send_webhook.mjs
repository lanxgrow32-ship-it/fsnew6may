
import https from 'https';

const url = 'https://hook.eu1.make.com/lm20hgqefloy6n16a7dwrbpt1epfk49t';
const data = JSON.stringify({
    user_name: "Test User",
    email: "test@example.com",
    plan_purchased: "5L 1-Step Fast Track",
    account_size: "500000",
    order_sn: "FS_TEST_12345",
    final_amount_paid: "12599",
    payment_method: "UPI",
    datetime: "2024-07-30 10:00:00"
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Sending test data to Make.com webhook...');

const req = https.request(url, options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('RESPONSE:', body);
    if (res.statusCode === 200) {
        console.log('\nSUCCESS: Test data sent. You can now configure your Make.com scenario.');
    } else {
        console.log('\nERROR: The webhook URL responded with an error.');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
