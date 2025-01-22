export async function getEmbedding(fileUrl, apiKey, apiEndpoint) {
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      response_as_dict: true,
      attributes_as_list: false,
      show_base_64: true,
      show_original_response: false,
      representation: "document",
      providers: ["google"],
      file_url: fileUrl,
    }),
  };

  const response = await fetch(apiEndpoint, options);
  const data = await response.json();
  const embedding = data?.google?.items[0]?.embedding;
  if (!embedding) return null;
  return new Float32Array(embedding);
}
