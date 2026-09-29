import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const language = (formData.get("language") as string) || "auto";

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided in request." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GROQ_API_KEY is not configured. Please set GROQ_API_KEY in your .env.local or Vercel environment variables.",
        },
        { status: 400 }
      );
    }

    const groqFormData = new FormData();
    groqFormData.append("file", file, "recording.webm");
    groqFormData.append("model", "whisper-large-v3");
    if (language && language !== "auto") {
      groqFormData.append("language", language);
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: groqFormData,
      }
    );

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Groq Whisper transcription error:", errText);
      return NextResponse.json(
        { error: `Transcription failed: ${errText}` },
        { status: groqResponse.status }
      );
    }

    const data = await groqResponse.json();
    return NextResponse.json({ text: data.text });
  } catch (error: unknown) {
    console.error("Transcribe API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during audio transcription.",
      },
      { status: 500 }
    );
  }
}
