const data = require("./auctions-sample-data.json");

const { decodeData, Item } = require("skyblock-parser");

data.auctions.forEach((auc) => {
  const buf = Buffer.from(auc.item_bytes, "base64");
  decodeData(buf)
    .then((d) => {
      if (d.i.length != 1) {
        throw "Malformed item_bytes! Received decoded data of length != 1.";
      }

      return d;
    })
    .then((d) => new Item(d.i[0]))
    .catch((e) => console.error(e));
});
