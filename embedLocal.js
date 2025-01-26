import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

export async function getLocalEmbedding(imagePath, apiKey, apiEndpoint) {
    // Create a FormData instance
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath)); // Append the image file
    form.append('response_as_dict', 'true');
    form.append('attributes_as_list', 'false');
    form.append('show_base_64', 'true');
    form.append('show_original_response', 'false');
    form.append('representation', 'document');
    form.append('providers', 'google,amazon');

    // Make the API call
    try {
        const response = await axios.post(apiEndpoint, form, {
            headers: {
                ...form.getHeaders(), // Set the correct headers for FormData
                Authorization: `Bearer ${apiKey}`
            }
        });
        const embedding = response.data?.google?.items[0]?.embedding;
        if (!embedding) return null;
        return new Float32Array(embedding);
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
}

export async function getBatchLocalEmbedding(imagePaths, apiKey, apiEndpoint) {
    const embeddings = [];
    for (const imagePath of imagePaths) {
        const embedding = await getLocalEmbedding(imagePath, apiKey, apiEndpoint);
        embeddings.push(embedding);
    }
    return embeddings;
}
