require("dotenv").config();

const fetch = require("node-fetch");
const fs = require("fs/promises");
const nbtLint = require("./nbt-lint.js");
const { Item, Pet } = require("skyblock-parser");

const fileExists = async (path) => !!(await fs.stat(path).catch((e) => false));

const ITEM_DATA_ROOT = "item-data";
const ITEM_DATA = new Map();

function nbtToJson(nbttag) {
  const d = nbttag.replace(/(,|\[)(\d+):/g, "$1");
  const parse = nbtLint.parse(d);

  const string = nbtLint.stringify(parse, null, {
    quoteKeys: true,
    hideSuffix: true,
    quoteChoice: "onlyDouble",
  });

  return { tag: JSON.parse(string) };
}

async function resolveEntry(key, nbtJson) {
  if (
    key.endsWith("_SC") ||
    key.endsWith("_MINIBOSS") ||
    key.endsWith("_BOSS") ||
    key.endsWith("_MONSTER")
  ) {
    return null;
  }

  const item = await new Item(nbtJson);

  delete item.active;

  for (key in item.attributes) {
    item[key] = item.attributes[key];
  }

  delete item.attributes;

  if ("recipe" in nbtJson) {
    item.recipe = nbtJson.recipe;
  }

  if ("crafttext" in nbtJson) {
    item.crafttext = nbtJson.crafttext;
  }

  if ("vanilla" in nbtJson) {
    item.vanilla = nbtJson.vanilla;
  }

  return item;
}

function loadItemData() {
  ITEM_DATA.clear();
  return fs.readdir(ITEM_DATA_ROOT).then((files) => {
    const promises = [];
    for (var i = 0; i < files.length; i++) {
      const f = files[i];

      promises.push(
        fs
          .readFile(`${ITEM_DATA_ROOT}/${f}`)
          .then((data) => JSON.parse(data))
          .then(async (json) => {
            const name = json.internalname;

            const nbt = nbtToJson(json.nbttag);
            const item = await resolveEntry(name, nbt);

            ITEM_DATA.set(name, item);
            return item;
          })
      );
    }

    return Promise.all(promises);
  });
}

async function downloadItemData(max = null) {
  if (!process.env.GITHUB_TOKEN) {
    throw "Cannot download new item database without GITHUB_TOKEN set.";
  }

  if (!(await fileExists(ITEM_DATA_ROOT))) {
    await fs.mkdir(ITEM_DATA_ROOT);
  }

  const opts = {
    headers: {
      authorization: `token ${process.env.GITHUB_TOKEN}`,
    },
  };

  const master = await fetch(
    "https://api.github.com/repos/Moulberry/NotEnoughUpdates-REPO/git/trees/master",
    opts
  ).then((a) => a.json());

  const itemsUrl = master.tree.filter((a) => a.path == "items")[0].url;

  const items = await fetch(itemsUrl, opts).then((a) => a.json());

  const promises = [];
  if (!max) {
    max = items.tree.length;
  }

  for (var i = 0; i < max; i++) {
    var a = items.tree[i];
    const p = fetch(a.url, opts)
      .then((d) => d.json())
      .then((json) => Buffer.from(json.content, json.encoding).toString())
      .then(async (content) => {
        const datum = JSON.parse(content);
        await fs.writeFile(
          `${ITEM_DATA_ROOT}/${datum.internalname}.json`,
          content
        );
        return datum;
      });
    promises.push(p);
  }

  return Promise.all(promises);
}

/*
downloadItemData()
  .then((d) => console.log(`Successfully downloaded ${d.length} item entries.`))
  .catch((e) => console.error(e));
*/

loadItemData().then(() => {
  const item = ITEM_DATA.get("ULTIMATE_SOUL_EATER;1");
  console.log(item);
});
