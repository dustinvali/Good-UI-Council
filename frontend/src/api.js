/**
 * API client for the LLM Council backend.
 */

const API_BASE = 'http://localhost:8001';

export const api = {
  /**
   * List all conversations.
   */
  async listConversations() {
    const response = await fetch(`${API_BASE}/api/conversations`);
    if (!response.ok) {
      throw new Error('Failed to list conversations');
    }
    return response.json();
  },

  /**
   * Create a new conversation.
   */
  async createConversation() {
    const response = await fetch(`${API_BASE}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }
    return response.json();
  },

  /**
   * Get a specific conversation.
   */
  async getConversation(conversationId) {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}`
    );
    if (!response.ok) {
      throw new Error('Failed to get conversation');
    }
    return response.json();
  },

  /**
   * Delete a conversation.
   */
  async deleteConversation(conversationId) {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      throw new Error('Failed to delete conversation');
    }
    return response.json();
  },

  /**
   * Send a message in a conversation.
   */
  async sendMessage(conversationId, content) {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}/message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      }
    );
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    return response.json();
  },

  /**
   * Send a message and receive streaming updates.
   * @param {string} conversationId - The conversation ID
   * @param {string} content - The message content
   * @param {function} onEvent - Callback function for each event: (eventType, data) => void
   * @param {object} options - Optional settings: { mode, councilModels, chairmanModel, abortSignal }
   * @returns {Promise<void>}
   */
  async sendMessageStream(conversationId, content, onEvent, options = {}) {
    let response;

    try {
      response = await fetch(
        `${API_BASE}/api/conversations/${conversationId}/message/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            council_models: options.councilModels,
            chairman_model: options.chairmanModel,
            attachments: options.attachments || [],
          }),
          signal: options.abortSignal,
        }
      );
    } catch (fetchError) {
      // Handle abort gracefully
      if (fetchError.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }
      console.error('Network error:', fetchError);
      onEvent('error', { message: 'Network error: Unable to connect to server' });
      return;
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('Server error:', response.status, errorText);
      onEvent('error', { message: `Server error: ${response.status}` });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let receivedComplete = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append new chunk to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines (SSE events end with double newline)
        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim() === '') continue;

            try {
              const event = JSON.parse(data);
              console.log('[SSE] Received event:', event.type, event);
              onEvent(event.type, event);

              if (event.type === 'complete') {
                receivedComplete = true;
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', data, e);
            }
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6);
        if (data.trim()) {
          try {
            const event = JSON.parse(data);
            onEvent(event.type, event);
            if (event.type === 'complete') {
              receivedComplete = true;
            }
          } catch (e) {
            console.error('Failed to parse final SSE event:', data, e);
          }
        }
      }

      // If stream ended without a complete event, call error
      if (!receivedComplete) {
        onEvent('error', { message: 'Stream ended unexpectedly without completion' });
      }
    } catch (streamError) {
      // Handle abort gracefully
      if (streamError.name === 'AbortError') {
        console.log('Stream was cancelled');
        return;
      }
      console.error('Stream reading error:', streamError);
      onEvent('error', { message: streamError.message || 'Stream reading failed' });
    }
  },
};
