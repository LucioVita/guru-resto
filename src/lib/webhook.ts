export async function sendWebhook(url: string, payload: any) {
    if (!url) return;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`Webhook failed: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Webhook error:', error);
    }
}
