```javascript
exports.handler = async function(event, context) {
    // 1. Check if the request is a POST request
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    // 2. Safely grab the GROQ API key from Netlify's environment variables
    const API_KEY = process.env.GROQ_API_KEY;
    
    if (!API_KEY) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Server Configuration Error: GROQ_API_KEY missing from environment." }) 
        };
    }

    try {
        // 3. Parse the data sent from your frontend
        const { systemPrompt, chatHistory } = JSON.parse(event.body);

        // 4. Format history for Groq (OpenAI standard format)
        const formattedHistory = chatHistory.map(msg => ({
            role: msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        }));

        // 5. Construct the payload for Groq
        const payload = {
            model: "llama-3.1-8b-instant", // CHANGED: Updated to a current, supported Groq model
            messages: [
                { role: "system", content: systemPrompt },
                ...formattedHistory
            ],
            temperature: 0.7,
            max_tokens: 400
        };

        const url = `https://api.groq.com/openai/v1/chat/completions`;

        // 6. Securely contact Groq from the server
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // 7. Catch API Errors exactly
        if (!response.ok) {
            console.error("GROQ API ERROR:", data);
            const groqError = data.error && data.error.message ? data.error.message : "Groq rejected the request";
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Groq Error: ${groqError}`, details: data })
            };
        }

        // 8. Send the text response back to your website
        return {
            statusCode: 200,
            body: JSON.stringify({ reply: data.choices[0].message.content })
        };

    } catch (error) {
        console.error("Error communicating with Groq API:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to communicate with AI Engine. Check Netlify logs." })
        };
    }
};

```
