const http = require('http');

async function run() {
  try {
    const items = [];
    for (let i = 0; i < 45; i++) {
      items.push({
        categorie: "Test",
        nom: "Test " + i,
        unite: "m²",
        prixUnitaireHT: 10,
        coutMatiere: 2
      });
    }
    
    // We cannot easily test next.js api without running the server, let's start the server in background.
  } catch (err) {
    console.error(err);
  }
}
run();
