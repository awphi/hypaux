const { promisify } = require("util");
const download = require("download-git-repo");
const fs = require("fs/promises");

const { Item } = require("skyblock-parser");

const NEU_PATH = "NEU-data";
const downloadPromise = promisify(download);

function buildItemDatabase() {
  return fs
    .readdir(`${NEU_PATH}/items`)
    .then((files) => {
      const promises = [];
      for (var i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.startsWith("_")) {
          continue;
        }
        promises.push(
          fs.readFile(`${NEU_PATH}/items/${f}`).then((data) => JSON.parse(data))
        );
      }

      return Promise.all(promises);
    })
    .then((items) => {
      const db = {};
      for (var i = 0; i < items.length; i++) {
        const name = items[i].internalname;

        if (name in db) {
          console.error(`Double-up on internalname: ${name}, skipping...`);
          continue;
        }

        db[name] = items[i];
      }

      /*
      fs.writeFile(
        `${NEU_PATH}/items/_DATABASE.json`,
        JSON.stringify(db)
      );
      */
      return db;
    });
}

downloadPromise("MoulBerry/NotEnoughUpdates-REPO", NEU_PATH)
  .then(() => buildItemDatabase())
  .then(async (data) => {
    console.log();
    //const item = await new Item();
    //console.log(item);
    console.log("COMPLETE", Object.keys(data).length);
  });
