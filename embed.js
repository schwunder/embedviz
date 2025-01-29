import fs from 'fs';
import axios from 'axios';

const createApiCallForm = (imagePath) => {
    const form = new FormData();
    const file = Bun.file(imagePath);
    form.append('file', file);
    form.append('response_as_dict', 'true');
    form.append('attributes_as_list', 'false');
    form.append('show_base_64', 'true');
    form.append('show_original_response', 'false');
    form.append('representation', 'document');
    form.append('providers', 'google');

    return form;
}

const createOptions = (apiKey, fileUrl) => {
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
        providers: ["google"],
        file_url: fileUrl,
      })
    : createApiCallForm(fileUrl);

  return { method: "POST", headers, body };
}

export const getEmbedding = async (fileUrl, apiKey, apiEndpoint) => {
  const options = createOptions(apiKey, fileUrl);

  try {
    const response = await fetch(apiEndpoint, options);
    const data = await response.json();
    const embedding = data?.google?.items[0]?.embedding;
    if (!embedding) throw new Error(`Failed to get valid embedding for ${fileUrl}`);
    return new Float32Array(embedding);
  } catch (error) {
    throw error;
  }
}

export const getEmbeddingBatch = async (imagePaths, apiKey, apiEndpoint) => {
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

