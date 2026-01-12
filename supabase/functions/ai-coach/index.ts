/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_LENGTH = 50;
const MAX_HISTORY_MESSAGE_LENGTH = 2000;

interface ConversationMessage {
  role: string;
  content: string;
}

function validateMessage(message: unknown): { valid: boolean; error?: string } {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: "Message is required and must be a string" };
  }
  
  if (message.length === 0) {
    return { valid: false, error: "Message cannot be empty" };
  }
  
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` };
  }
  
  return { valid: true };
}

function validateConversationHistory(history: unknown): { valid: boolean; error?: string } {
  if (history === undefined || history === null) {
    return { valid: true }; // History is optional
  }
  
  if (!Array.isArray(history)) {
    return { valid: false, error: "Conversation history must be an array" };
  }
  
  if (history.length > MAX_HISTORY_LENGTH) {
    return { valid: false, error: `Conversation history too long (max ${MAX_HISTORY_LENGTH} messages)` };
  }
  
  for (let i = 0; i < history.length; i++) {
    const msg = history[i];
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: `Invalid message at position ${i}` };
    }
    
    if (!msg.role || typeof msg.role !== 'string') {
      return { valid: false, error: `Invalid role at position ${i}` };
    }
    
    if (!['user', 'assistant', 'system'].includes(msg.role)) {
      return { valid: false, error: `Invalid role value at position ${i}` };
    }
    
    if (!msg.content || typeof msg.content !== 'string') {
      return { valid: false, error: `Invalid content at position ${i}` };
    }
    
    if (msg.content.length > MAX_HISTORY_MESSAGE_LENGTH) {
      return { valid: false, error: `Message at position ${i} exceeds max length` };
    }
  }
  
  return { valid: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { message, conversationHistory } = body;

    // Validate message
    const messageValidation = validateMessage(message);
    if (!messageValidation.valid) {
      return new Response(
        JSON.stringify({ error: messageValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate conversation history
    const historyValidation = validateConversationHistory(conversationHistory);
    if (!historyValidation.valid) {
      return new Response(
        JSON.stringify({ error: historyValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are Liq, a friendly and encouraging AI learning coach for LiqLearns, an Ethiopian educational platform. Your role is to:

1. Help users learn Amharic language - teach greetings, vocabulary, grammar, and pronunciation
2. Quiz users on their knowledge and provide feedback
3. Explain Ethiopian culture, history, and traditions
4. Practice conversations in Amharic with learners
5. Motivate and encourage students in their learning journey

Guidelines:
- Use a warm, supportive tone with occasional Ethiopian expressions
- Include Amharic script (ፊደል) when teaching language
- Add relevant emojis to make responses engaging
- Keep responses concise but informative
- Celebrate progress and encourage practice
- Provide pronunciation tips using transliteration

Start responses with Amharic greetings when appropriate like ሰላም (selam - hello) or እንደምን (endemin - how are you).`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []).map((msg: ConversationMessage) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI API error: ${response.status}`);
      throw new Error("AI service temporarily unavailable");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in ai-coach function:", error);
    // Return generic error message to client (don't expose internal details)
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
