//from env get key
const apiKey = process.env.EDEN_API_KEY;

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
    file_url: "https://markusstrasser.org/images/fineart_collage2.jpg",
  }),
};

const response = await fetch(
  "https://api.edenai.run/v2/image/embeddings",
  options
);
const data = await response.json();
console.log(data.google.items[0]);
