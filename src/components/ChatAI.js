// Minimal placeholder AI that echoes user input with character flavor
export class ChatAIClass {
  constructor(characterData) {
    this.characterData = characterData || { name: 'Character' };
    this.history = [];
  }

  async getInitialGreeting() {
    const name = this.characterData.name || 'Character';
    return `Hi, I'm ${name}. What would you like to talk about?`;
  }

  async getResponseWithHistory(userMessage) {
    this.history.push({ role: 'user', content: userMessage });
    const prefix = this.characterData?.name ? `${this.characterData.name}:` : 'Character:';
    const reply = `${prefix} ${this._shorten(userMessage)}`;
    this.history.push({ role: 'assistant', content: reply });
    return reply;
  }

  _shorten(text) {
    if (!text) return 'Okay.';
    const t = String(text).trim();
    return t.length > 120 ? t.slice(0, 117) + '...' : t;
  }
}


