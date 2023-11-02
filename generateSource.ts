import { Artwork } from './types';
import { Ollama } from 'ollama-node';
import * as fs from 'node:fs';

const numberOfArtworks = 10;
// const artURL = `https://api.artic.edu/api/v1/artworks?limit=${numberOfArtworks}`

const fetchArtistWorks = async (artist: string): Promise<number[]> => {
  const artistURL = `https://api.artic.edu/api/v1/artworks/search?q=${artist}&limit=${numberOfArtworks}`;
  const response = await fetch(artistURL);
  const json = await response.json();
  const artistWorks: { id: number }[] = json.data;
  return artistWorks.map((work) => work.id);
}

const sanitize = (badstring: string): string => {
  if (badstring !== null) {
    badstring = badstring.replace(/[\u2018\u2019]/gm, "\'")
      .replace(/[\u201C\u201D]/gm, '\"')
      .replace(/[\u2013\u2014]/gm, "-")
      .replace(/[\u2026]/gm, "...")
      .replace(/[\u00A0]/gm, " ")
      .replace(/[\u00AD]/gm, "-")
      .replace(/[\u00B0]/gm, " degrees ")
      .replace(/[\u00B1]/gm, " plus or minus ")
      .replace(/[\u00B2]/gm, " squared ")
      .replace(/[\u00B3]/gm, " cubed ")
      .replace(/[\u00B4]/gm, "'")
      .replace(/[\u00B5]/gm, " micro ")
      .replace(/[\u00B6]/gm, " paragraph ")
      .replace(/[\u00B7]/gm, " dot ")
      .replace(/[\u00B8]/gm, ",")
      .replace(/[\u00B9]/gm, " first ")
      .replace(/[\u00BA]/gm, " degrees ")
      .replace(/[\u00BB]/gm, ">>")
      .replace(/[\u00BC]/gm, " 1/4 ")
      .replace(/[\u00BD]/gm, " 1/2 ")
      .replace(/[\uFB01]/gm, "fi")
      .replace(/[\uFB02]/gm, "fl")
      .replace(/[\uFB03]/gm, "ffi")
      .replace(/[\uFB04]/gm, "ffl")
      .replace(/[\uFB05]/gm, "ft")
      .replace(/[\uFB06\uFB07\uFB08]/gm, "st")
      .replace(/[\u00D7]/gm, "x")
      .replace(/[\u00E8\u00E9]/gm, "e")
      .replace(/[\u00F1]/gm, "n")
      .replace(/[\u00F6]/gm, "o")
      .replace(/[\u00F8]/gm, "o")
      .replace(/[\u00FC]/gm, "u")
      .replace(/[\u00FF]/gm, "y")
      .replace(/[\u0101\u0103\u00E0]/gm, "a")
      .replace(/[\u00C9]/gm, "E")
      .replace(/<p>/gm, "")
      .replace(/<\/p>/gm, "\n");
  } else {badstring = " "};
  return badstring
}

const fetchArtwork = async (workids: number[]): Promise<Artwork[]> => {
  const artworks: Artwork[] = [];
  const ollama = new Ollama();
  for await (const workid of workids) {
    const artworkURL = `https://api.artic.edu/api/v1/artworks/${workid}`;
    const response = await fetch(artworkURL);
    const json = await response.json();
    const artworkraw: Artwork = json.data as Artwork;
    // const embbedding = await ollama.generateEmbed("llama2", sanitize(artworkraw.description));
    const artwork: Artwork = {
      id: artworkraw.id,
      title: sanitize(artworkraw.title),
      artist_display: sanitize(artworkraw.artist_display),
      place_of_origin: artworkraw.place_of_origin,
      date_start: artworkraw.date_start,
      date_end: artworkraw.date_end,
      duration: artworkraw.date_end - artworkraw.date_start,
      dimensions: sanitize(artworkraw.dimensions),
      medium_display: artworkraw.medium_display,
      credit_line: artworkraw.credit_line,
      artwork_type_title: artworkraw.artwork_type_title,
      department_title: artworkraw.department_title,
      artist_title: artworkraw.artist_title,
      classification_title: artworkraw.classification_title,
      description: sanitize(artworkraw.description),
      // description_embedding: embbedding,
    }

    console.log("------------------")
    let duration = "less than a year";
    if (artwork.duration == 1) {
      duration = "1 year";
    } else if (artwork.duration > 1) {
      duration = `${artwork.duration} years`;
    }
    console.log(`${artwork.title} - ${artwork.artist_title} - ${duration}`);
    artworks.push(artwork);
  }

  return artworks;
}

const getArt = async (artists: string[]): Promise<Artwork[]> => {
  const artworks: Artwork[] = [];
  for await (const artist of artists) {
    const artistWorks = await fetchArtistWorks(artist);
    const artwork = await fetchArtwork(artistWorks);
    artworks.push(...artwork);
  }
  return artworks;
}


const generateSource = async () => {
  const artists = ["monet", "picasso", "vangogh", "renoir"];
  const artworks = await getArt(artists);
  fs.writeFileSync("artworks.json", JSON.stringify(artworks, null, 2))
  // for await (const artwork of art) {
  //   let embedding: number[] = [];
  //   const ollama = new Ollama();
  //   await ollama.setModel("llama2");
  //   console.log(artwork)
  //   if (artwork.description !== null) {
  //     embedding = await ollama.generateEmbed("llama2", artwork.description);
  //     console.log(`Embedding for ${artwork.title} completed`)
  //     console.log(artwork.description)
  //   } else {
  //     console.log(`Embedding for ${artwork.title} skipped`)
  //   }
  //   const artworkjson =  {
  //     id: artwork.id,
  //     title: artwork.title,
  //     artist_display: artwork.artist_display,
  //     place_of_origin: artwork.place_of_origin,
  //     dimensions: artwork.dimensions,
  //     medium_display: artwork.medium_display,
  //     credit_line: artwork.credit_line,
  //     artwork_type_title: artwork.artwork_type_title,
  //     department_title: artwork.department_title,
  //     artist_title: artwork.artist_title,
  //     classification_title: artwork.classification_title,
  //     description: artwork.description,
  //     description_embedding: embedding,
  //   }

  //   // console.log(artworkjson)
  //   docs.push(artworkjson);
  // }
  // // art.map(async (artwork) => {
  // //   let embedding: number[] = [];
  // //   const ollama = new Ollama();
  // //   await ollama.setModel("llama2");
  // //   if (artwork.description !== null) {
  // //     embedding = await ollama.generateEmbed("llama2", artwork.description);
  // //   }
  // //   const artworkjson =  {
  // //     id: artwork.id,
  // //     title: artwork.title,
  // //     artist_display: artwork.artist_display,
  // //     place_of_origin: artwork.place_of_origin,
  // //     dimensions: artwork.dimensions,
  // //     medium_display: artwork.medium_display,
  // //     credit_line: artwork.credit_line,
  // //     artwork_type_title: artwork.artwork_type_title,
  // //     department_title: artwork.department_title,
  // //     artist_title: artwork.artist_title,
  // //     classification_title: artwork.classification_title,
  // //     description: artwork.description,
  // //     description_embedding: embedding,
  // //   }
  // //   console.log(artworkjson)
  // //   docs.push(artworkjson);
  // // })
  // // console.log(JSON.stringify(docs, null, 2));
}

generateSource();