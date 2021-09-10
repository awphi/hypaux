const { Item } = require("skyblock-parser");
const nbtLint = require("./nbt-lint.js");

const DATA =
  '{CustomPotionEffects:[0:{Ambient:0b,Duration:20,Id:12b,Amplifier:0b}],HideFlags:254,display:{Lore:[0:"",1:"§6Absorption",2:"§7Grants a boost to absorption",3:"§7health.",4:"",5:"§f§lCOMMON"],Name:"§fAbsorption Potion"},ExtraAttributes:{id:"ABSORPTION"}}';

const d = DATA.replace(/(,|\[)(\d+):/g, "$1");

const parse = nbtLint.parse(d);
const string = nbtLint.stringify(parse, null, {
  quoteKeys: true,
  hideSuffix: true,
});

const json = JSON.parse(string);

new Item({ tag: json }).then((da) => {});
