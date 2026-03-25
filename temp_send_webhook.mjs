// IMPORTANT: Before running this script, do the following:
// 1. In your Make.com webhook settings, click "+ Add API Key" to generate a key.
// 2. Copy the generated key.
// 3. Paste your key below, replacing 'YOUR_MAKE_API_KEY_HERE'.
const apiKey = 'YOUR_MAKE_API_KEY_HERE';

const webhookUrl = 'https://hook.eu1.make.com/lm20hgqefloy6n16a7dwrbpt1epfk49t';

const sampleData = {
    user_name: 'John Doe',
    email: 'john.doe@example.com',
    plan_purchased: '5L Instant Funding',
    account_size: '500000',
    order_sn: 'FS_123456789',
    final_amount_paid: '17999',
    payment_method: 'UPI',
    datetime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
};

async function sendTestWebhook() {
    if (apiKey === 'YOUR_MAKE_API_KEY_HERE' || !apiKey) {
        console.error('\x1b[31m%s\x1b[0m', 'ERROR: Please replace "YOUR_MAKE_API_KEY_HERE" in this script with your actual API key from Make.com.');
        return;
    }

    console.log('Sending test data to Make.com webhook...');
    console.log('URL:', webhookUrl);

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-make-apikey': apiKey
            },
            body: JSON.stringify(sampleData)
        });

        if (response.ok) {
            const responseText = await response.text();
            if (responseText === 'Accepted') {
                console.log('\x1b[32m%s\x1b[0m', 'SUCCESS: Test data sent and accepted by Make.com!');
                console.log('You should now see the data structure in your Make.com scenario. You can map the fields in your Resend module.');
            } else {
                 console.error('\x1b[33m%s\x1b[0m', `WARNING: Make.com responded, but not with "Accepted". Response: ${responseText}`);
            }
        } else {
            console.error('\x1b[31m%s\x1b[0m', `ERROR: Failed to send test data. Status: ${response.status}`);
            const errorText = await response.text();
            console.error('Response body:', errorText);
        }
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', 'An error occurred while sending the request:', error);
    }
}

sendTestWebhook();
