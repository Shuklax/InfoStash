import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export async function parseFullTextQuery(query: string) {
  const prompt = `
You are a parser that converts natural language search queries into JSON matching this schema:

{
  "technologyFilter": { "and": string[], "or": string[], "none": string[], "removeDuplicates": boolean, "filteringType": "together" | "individual" },
  "countryFilter": { "and": string[], "or": string[], "none": string[], "removeDuplicates": boolean, "filteringType": "together" | "individual" },
  "categoryFilter": { "and": string[], "or": string[], "none": string[], "removeDuplicates": boolean, "filteringType": "together" | "individual" },
  "nameFilter": { "and": string[], "or": string[], "none": string[], "removeDuplicates": boolean, "filteringType": "together" | "individual" },
  "domainFilter": { "and": string[], "or": string[], "none": string[], "removeDuplicates": boolean, "filteringType": "together" | "individual" },
  "numberFilter": { "totalTechnologies": number, "technologiesPerCategory": number }
}

Strict rules for parsing:
- Always output valid JSON only, no text or markdown.
- If a field is not specified in the query, leave it empty ("" for strings, [] for arrays, 0 for numbers, false for booleans).
- For countryFilter: normalize country names into ISO-2 codes (e.g. "United States" -> "US", "United Kingdom" -> "UK").
- For categoryFilter: only use clean category names like "Travel", "Finance", "E-commerce". 
  Remove suffixes like "companies", "businesses", "startups", "firms", etc. 
  Example: "travel companies in the US" -> { countryFilter: ["US"], categoryFilter: ["Travel"] }.
- For technologyFilter: extract specific technologies mentioned (e.g. "using AWS and React" -> ["AWS", "React"]).
- Ignore irrelevant filler words and focus on structured data.
- Never merge entity type and category. ("Fintech startups" -> "Fintech").
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: query },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content ?? "{}");
}
