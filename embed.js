import fs from 'fs';
import axios from 'axios';

export const createApiCallForm = (imagePath) => {
    const form = new FormData();
    const file = Bun.file(imagePath);
    form.append('file', file);
    form.append('response_as_dict', 'true');
    form.append('attributes_as_list', 'false');
    form.append('show_base_64', 'true');
    form.append('show_original_response', 'false');
    form.append('representation', 'document');
    form.append('providers', 'amazon');

    return form;
}

export const createOptions = (apiKey, fileUrl) => {
  const headers = { 
    accept: "application/json",
     Authorization: `Bearer ${apiKey}`
     };
  const isRemote = (() => { 
    try { 
        return new URL(fileUrl).protocol
        .startsWith('http') } 
        catch { return false } })();
  if (isRemote) headers["content-type"] = "application/json";

  const body = isRemote
    ? JSON.stringify({
        response_as_dict: true,
        attributes_as_list: false,
        show_base_64: true,
        show_original_response: false,
        representation: "document",
        providers: ["amazon"],
        file_url: fileUrl,
      })
    : createApiCallForm(fileUrl);

  return { method: "POST", headers, body };
}

export const getEmbedding = async (fileUrl, apiKey, apiEndpoint) => {
  const options = createOptions(apiKey, fileUrl);

  try {
    const response = await fetch(apiEndpoint, options);
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }

    // Parse JSON and handle parsing errors explicitly
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error(`Failed to parse API response: ${parseError.message}`);
    }

    // Add response logging for debugging
    if (!data?.amazon?.items?.[0]) {
      console.error('Unexpected API response structure:', JSON.stringify(data, null, 2));
      throw new Error(`Invalid API response structure for ${fileUrl}`);
    }

    const embedding = data.amazon.items[0].embedding;
    if (!embedding) {
      console.error('API response missing embedding:', JSON.stringify(data.amazon.items[0], null, 2));
      throw new Error(`No embedding found in API response for ${fileUrl}`);
    }

    return new Float32Array(embedding);
  } catch (error) {
    // Wrap all errors with context
    throw new Error(`Error processing ${fileUrl}: ${error.message}`);
  }
}

export const getEmbeddingsLoop = async (imagePaths, apiKey, apiEndpoint) => {
    const embeddings = [];
    
    for (const imagePath of imagePaths) {
        try {
            const embedding = await getEmbedding(imagePath, apiKey, apiEndpoint);
            if (embedding && embedding instanceof Float32Array) {
                embeddings.push(embedding);
            }
        } catch (error) {
            continue;
        }
    }
    
    if (embeddings.length === 0) {
        throw new Error('All embeddings failed to generate');
    }
    
    return embeddings;
}
