import * as fs from "fs";
import { Artwork } from "./types";
// import prompts from "prompts";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "langchain/document";
import { AttributeInfo } from "langchain/schema/query_constructor";
import { HuggingFaceTransformersEmbeddings } from "langchain/embeddings/hf_transformers";

import {Ollama} from "langchain/llms/ollama"
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { FunctionalTranslator } from "langchain/retrievers/self_query/functional";

const loadFile = (): Document[] => {
  const data = fs.readFileSync("artworks.json");
  const artworks: Artwork[] = JSON.parse(data.toString());
  return artworks.map((artwork) => {
    const doc = new Document({
      pageContent: artwork.description,
      metadata: {
        // id: artwork.id,
        title: artwork.title,
        // date_start: artwork.date_start,
        // date_end: artwork.date_end,
        date: artwork.date_end, 
        // duration: artwork.duration,
        // place_of_origin: artwork.place_of_origin,
        // medium_display: artwork.medium_display,
        // artwork_type_title: artwork.artwork_type_title,
        // department_title: artwork.department_title,
        // artist_title: artwork.artist_title,
        artist: artwork.artist_title,
        // classification_title: artwork.classification_title,
      }
    })
    return doc;
  })
}

const attributeInfo: AttributeInfo[] = [
  // {
  //   name: "id",
  //   type: "number",
  //   description: "The id of the artwork"
  // }, 
  {
    name: "title",
    type: "string",
    description: "The title of the artwork"
  }, 
  // {
  //   name: "place_of_origin",
  //   type: "string",
  //   description: "The place of origin of the artwork"
  // }, 
  // {
  //   name: "date_start",
  //   type: "number",
  //   description: "The year the artwork was started"
  // },
  // {
  //   name: "date_end",
  //   type: "number",
  //   description: "The year the artwork was finished"
  // },
  {
    name: "date",
    type: "number",
    description: "The year the artwork was created"
  },
  // {
  //   name: "duration",
  //   type: "number",
  //   description: "How long the artwork took to make", 
    
  // },
  //  {
  //   name: "medium_display",
  //   type: "string",
  //   description: "The medium display of the artwork"
  // }, {
  //   name: "artwork_type_title",
  //   type: "string",
  //   description: "The type of artwork, such as painting or sculpture"
  // }, {
  //   name: "department_title",
  //   type: "string",
  //   description: "The department of the museum that holds the artwork"
  // }, 
  {
    name: "artist",
    type: "string",
    description: "The artist of the artwork"
  },
  // {
  //   name: "classification_title",
  //   type: "string",
  //   description: "The classification of the artwork"
  // }
]

const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: "Xenova/all-MiniLM-L6-v2",
});

const llm = new Ollama({
  model: "llama2"
})
const documentContents = "Description of the artwork and its significance";

const findArt = async () => {
  const artworks = loadFile();
  const vectorStore = await MemoryVectorStore.fromDocuments(loadFile(), embeddings);
  const selfQueryRetriever = SelfQueryRetriever.fromLLM({
    llm, vectorStore, documentContents, attributeInfo, structuredQueryTranslator: new FunctionalTranslator()
  });
  // const query = await prompts({
  //   type: "text",
  //   name: "query",
  //   message: "What would you like to search for?"
  // })
  // console.log(query.query);
  const query = "what did renoir paint in 1881"
  // const query = "Did Renoir ever paint anything showing women working in some way?"
  const newquery = await selfQueryRetriever.getRelevantDocuments(query);
  console.log(newquery);
}

findArt();