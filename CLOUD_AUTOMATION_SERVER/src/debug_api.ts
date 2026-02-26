import "dotenv/config";
import MetaApi from 'metaapi.cloud-sdk';

const token = process.env.METAAPI_TOKEN || "";
console.log("Token length:", token.length);

console.log("MetaApi default:", MetaApi);
console.log("MetaApi keys:", Object.keys(MetaApi));

const m = new (MetaApi as any)(token);
console.log("Client created. metatraderAccountApi exists:", !!m.metatraderAccountApi);
