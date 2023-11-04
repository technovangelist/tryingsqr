import { Chroma } from "langchain/vectorstores/chroma";
import { ChromaTranslator } from "langchain/retrievers/self_query/chroma";
import { Ollama } from "langchain/llms/ollama"
import { AttributeInfo } from "langchain/schema/query_constructor";
import { HuggingFaceTransformersEmbeddings } from "langchain/embeddings/hf_transformers";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";

const modelName = "codellama";

const attributeInfo: AttributeInfo[] = [
  {
    name: "title",
    type: "string",
    description: "The title of the painting"
  },
  {
    name: "date",
    type: "integer",
    description: "The four digit year when the painting was created"
  },
  {
    name: "artist",
    type: "strings",
    description: "The last name of the artist who created the painting."
  }
]

const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: "Xenova/all-MiniLM-L6-v2",
});

const llm = new Ollama({
  model: modelName
})

const documentContents = "Description of the art";

const findArt = async () => {
  const vectorStore = await Chroma.fromExistingCollection(embeddings, {
    collectionName: "artcollection",
  });
  // const vectorStore = await HNSWLib.load("artcollection", embeddings);

  const retriever = SelfQueryRetriever.fromLLM({
    llm, vectorStore, documentContents, attributeInfo, verbose: false, useOriginalQuery: true, structuredQueryTranslator: new ChromaTranslator()
  });

  const query = process.argv[2];

  try {
    const newquery = await retriever.getRelevantDocuments(query, [
      {
        handleLLMEnd(output) {
          console.log("llm end")
          const outout = output.generations[0][0].text.replace(/\\"/gm, "'").replace(/\n/gm, "")
          console.log(`output - ${JSON.stringify(outout, null, 2)}`)
        }
      },
    ]);
    console.log(newquery);
  } catch (error) {
    console.log(`There was an error getting the values: ${error}`);
  }
}

findArt();