//aiService.js

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'; 

async function openAIChat(messages, { model = OPENAI_MODEL, temperature = 0.4 } = {}) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ model, messages, temperature })
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI API error ${res.status}: ${errText}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

const formatWithLineBreaks = (text) => {
    return text.replace(/•/g, '•\n');
};

const getInitialAnalysis = async (summary, transactions) => {
    const analysisPrompt = `As a financial advisor for Indian college students, analyze this financial data and provide a brief initial assessment. Use pointers and emojis to make it easy to read:

Summary: ${JSON.stringify(summary)}
Transactions: ${JSON.stringify(transactions)}

Provide a concise analysis covering:
1. Overall spending patterns 💸
2. Key areas of concern ⚠️
3. Positive financial habits 🌟
4. One specific actionable suggestion 💡

Keep it friendly and focused on the student context.`;

    try {
        const text = await openAIChat([
            { role: 'system', content: 'You are a concise, friendly financial advisor for Indian college students. Use bullet points and emojis.' },
            { role: 'user', content: analysisPrompt }
        ], { model: OPENAI_MODEL, temperature: 0.4 });
        return formatWithLineBreaks(text);
    } catch (error) {
        console.error('Error with OpenAI API:', error);
        return 'I apologize, but I encountered an error analyzing your financial data. Feel free to ask me specific questions about your finances.';
    }
};

const chatWithAI = async (message, summary, transactions) => {
    const contextPrompt = `You are a financial advisor for Indian college students. Here is the current financial context. Respond using pointers and emojis for clarity:

Summary: ${JSON.stringify(summary)}
Transactions: ${JSON.stringify(transactions)}

Consider these student-specific factors when giving advice:
1. Monthly budget constraints with limited pocket money/part-time income
2. Common expenses: food/canteen, transport, study materials, entertainment
3. Peer pressure spending
4. Education-related costs
5. Basic savings goals

User message: ${message}

Provide specific, actionable advice in bullet points, with emojis where possible, that's relevant to Indian college students.`;

    try {
        const text = await openAIChat([
            { role: 'system', content: 'You are a helpful financial advisor for Indian college students. Use bullet points and emojis.' },
            { role: 'user', content: contextPrompt }
        ], { model: OPENAI_MODEL, temperature: 0.5 });
        return formatWithLineBreaks(text);
    } catch (error) {
        console.error('Error with OpenAI API:', error);
        return 'Sorry, I encountered an error. Please try again.';
    }
};

module.exports = { chatWithAI, getInitialAnalysis };
