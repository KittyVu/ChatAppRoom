export async function isMessageInappropriate(content: string): Promise<boolean> {
  try {
    const safeContent = content.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: `You are a content moderator.
Classify the following message as either "OK" or "BAD".
Answer ONLY with OK or BAD.

Message: "${safeContent}"`,
        stream: false
      }),
    });

    const data = await response.json();
    const rawAnswer = data.response?.trim(); 
    console.log("LLM raw answer:", rawAnswer);

    if (!rawAnswer) return false;
    const answer = rawAnswer.toUpperCase();
    return answer === "BAD";
  } catch (err) {
    console.error("AI filter error:", err);
    return false;
  }
}



