exports.handler = async function(event, context) {
    // 1. Check if the request is a POST request
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    // 2. Safely grab the API key from Netlify's secret vault
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Server Configuration Error: API Key missing." }) 
        };
    }

    try {
        // 3. Parse the data sent from your frontend
        const { systemPrompt, chatHistory } = JSON.parse(event.body);

        // 4. Construct the payload for Gemini
        const payload = {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: chatHistory
        };

        // Use the stable gemini-1.5-flash model
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        // 5. Securely contact Google Gemini from the server
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // NEW: If Google rejects the request, log the exact error!
        if (!response.ok) {
            console.error("GOOGLE API ERROR:", data);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: "Google rejected the request", details: data })
            };
        }

        // 6. Send the response back to your website
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("Error communicating with Gemini API:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to communicate with AI Engine" })
        };
    }
};