

import OpenAI from 'openai';

const OPENAI_API_KEY = '';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

class GeminiTransactionParser {
  constructor({ model } = {}) {
    this.model = model || DEFAULT_OPENAI_MODEL;
    this.client = new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true });
  }

  async parseReceipt(text, options = {}) {
    const categories = options.categories || [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Bills & Utilities',
      'Health & Fitness',
      'Travel',
      'Other',
    ];

    const accounts = options.accounts || [
      'Cash',
      'Bank Account',
      'Credit Card',
      'Savings',
      'Investment',
    ];

    const prompt = `Analyze the following receipt text and extract these details in a clear key:value format with one per line (Amount, Category, Account, Notes).\n\n- Amount (number only)\n- Category (choose from: ${categories.join(', ')})\n- Account (choose from: ${accounts.join(', ')})\n- Notes (optional, short)\n\nReceipt text:\n${text}`;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You extract structured data from receipts. Respond using simple key:value pairs.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      });

      const response = completion.choices?.[0]?.message?.content || '';
      return this.parseLLMResponse(response);
    } catch (error) {
      console.error('Error with OpenAI API:', error);
      throw error;
    }
  }

  parseLLMResponse(response) {
    const lines = (response || '').split('\n');
    const details = {};

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();

      if (key === 'amount') {
        details.amount = parseFloat(value.replace(/[^0-9.]/g, ''));
      } else if (key === 'category') {
        details.category = value;
      } else if (key === 'account') {
        details.account = value;
      } else if (key === 'notes' || key === 'note') {
        details.notes = value;
      }
    }

    return details;
  }
}

export default GeminiTransactionParser;