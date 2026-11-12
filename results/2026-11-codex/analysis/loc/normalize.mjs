import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseArgs } from 'node:util';
import * as prettier from 'prettier';
import * as svelteNamespace from 'prettier-plugin-svelte';
const {values}=parseArgs({options:{input:{type:'string'},output:{type:'string'},metrics:{type:'string'},policy:{type:'string'}}});
for(const name of ['input','output','metrics','policy'])if(!values[name])throw Error('Missing --'+name);
const inputFile=path.resolve(values.input),base=path.dirname(inputFile),output=path.resolve(values.output);
const inputs=JSON.parse(await fs.readFile(inputFile,'utf8')),policy=JSON.parse(await fs.readFile(values.policy,'utf8'));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const lines=text=>text.split('\n').filter(line=>line.trim().length>0).length;
const plugin=svelteNamespace.default??svelteNamespace;
const tools={node:process.version,platform:process.platform,arch:process.arch,prettier:prettier.version};
for(const name of ['prettier-plugin-svelte','svelte'])tools[name]=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'node_modules',name,'package.json'),'utf8')).version;
for(const [name,expected]of Object.entries(policy.formatter_pins))if(tools[name]!==expected)throw Error(`Tool identity mismatch ${name}: ${tools[name]} != ${expected}`);
const report={schemaVersion:1,tools,options:policy.formatter_options,builds:[],failures:[]};
for(const build of inputs.builds){
 const result={framework:build.framework,build:build.build,files:[],status:'complete',originalBytes:0,originalNonblankLoc:0,normalizedBytes:0,normalizedNonblankLoc:0};
 for(const file of build.files){
  const record={path:file.path,parser:file.parser,originalSha256:file.sha256,originalBytes:file.bytes};
  try{
   const bytes=await fs.readFile(path.join(base,file.input));if(hash(bytes)!==file.sha256)throw Error('Input hash differs from captured original');
   const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);record.originalNonblankLoc=lines(text);
   if(!file.parser)throw Error('No pinned parser/plugin for this whitelisted extension');
   const options={...policy.formatter_options,filepath:file.path,parser:file.parser,plugins:[plugin]};
   let formatted=text,stable=false,transformations=0,calls=0;
   for(let pass=0;pass<6;pass++){const next=await prettier.format(formatted,options);calls++;if(next===formatted){stable=true;break;}if(pass===5)break;formatted=next;transformations++;}
   if(!stable)throw Error('Formatter output did not stabilize within five transformations');record.formatTransformations=transformations;record.formatterCalls=calls;
   const formattedBytes=Buffer.from(formatted,'utf8');record.normalizedBytes=formattedBytes.length;record.normalizedNonblankLoc=lines(formatted);record.normalizedSha256=hash(formattedBytes);record.status='formatted';
   const destination=path.join(output,build.framework,build.build,file.path);await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,formattedBytes);
  }catch(error){record.status='failed';record.error=String(error.message??error);result.status='incomplete';report.failures.push({framework:build.framework,build:build.build,...record});}
  result.originalBytes+=record.originalBytes;result.originalNonblankLoc+=record.originalNonblankLoc??0;result.normalizedBytes+=record.normalizedBytes??0;result.normalizedNonblankLoc+=record.normalizedNonblankLoc??0;result.files.push(record);
 }
 if(result.status!=='complete'){result.normalizedBytes=null;result.normalizedNonblankLoc=null;}
 report.builds.push(result);console.log(JSON.stringify({framework:result.framework,build:result.build,files:result.files.length,status:result.status,loc:result.normalizedNonblankLoc,originalBytes:result.originalBytes,normalizedBytes:result.normalizedBytes}));
}
await fs.mkdir(path.dirname(path.resolve(values.metrics)),{recursive:true});await fs.writeFile(values.metrics,JSON.stringify(report,null,2)+'\n');
if(report.failures.length)process.exitCode=1;
