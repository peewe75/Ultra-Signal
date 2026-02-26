import "dotenv/config";
const MetaApi = require('metaapi.cloud-sdk');

const token = process.env.METAAPI_TOKEN || "";
const metaApi = new MetaApi(token);

console.log("Root MetaApi keys:");
console.log(Object.keys(metaApi));

if (metaApi.metatraderAccountApi) {
    console.log("metatraderAccountApi keys:");
    console.log(Object.keys(metaApi.metatraderAccountApi));

    // Some property prototypes might not be enumerable
    console.log("Prototypes:");
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(metaApi.metatraderAccountApi)));
} else {
    console.log("No metatraderAccountApi property found at the root!");
}
