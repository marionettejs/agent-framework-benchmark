"""Read-only verification of the selected 24-app evidence; no app/model execution."""
import csv,hashlib,json,math,statistics
from pathlib import Path
R=Path(__file__).resolve().parent
def load(p):return json.loads(p.read_text())
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
summary=load(R/'summary.json');rows=summary['records'];assert len(rows)==24
frameworks=['marionette','vanilla','react-router','sveltekit','nuxt','angular']
routes=['home/mobile','home-filtered/mobile','pokemon/mobile','move/mobile','ability/mobile','type/mobile']
metrics=['performance','accessibility','lcp','tbt','cls','scriptBytes']
manifest=load(R/'FILE_MANIFEST.json')
for name,entry in manifest['files'].items():
 p=R/name;assert p.is_file() and not p.is_symlink() and p.resolve().is_relative_to(R)
 assert p.stat().st_size==entry['bytes'] and digest(p)==entry['sha256'],name
for framework in frameworks:assert {x.name for x in (R/framework).iterdir() if x.is_dir()}=={'b1','b2','b3','b4'}
samples=0
for row in rows:
 frame=row['framework'];b=row['build'];p=R/frame/b;assert frame in frameworks
 n=load(p/'agent/native-timing-usage.json');info=load(p/'agent/run-info.json');a=load(p/'agent/acceptance.json');m=load(p/'measure/results.json')
 assert a['exit']==0 and a['passed']==a['total']==54
 assert n['terminalStatus']=='completed' and n['model']=='gpt-6.1-sol' and n['reasoningEffort'] is None
 assert n['elapsed_seconds']==row['generationSeconds']==info['generationSeconds'] and info['measurementExit']==0
 assert n['usage']==row['nativeUsage'];u=n['usage'];assert u['input_tokens']-u['cached_input_tokens']==u['uncached_input_tokens']
 assert n['actualSubscriptionDebitUsd'] is None
 assert info['resources']=={'cpus':4,'memoryGiB':8}
 assert list(m['lighthouse'])==routes
 for route in routes:
  v=m['lighthouse'][route];assert len(v['runs'])==5;samples+=5
  for k in metrics:
   values=[x[k] for x in v['runs']];assert all(math.isfinite(x) for x in values)
   assert abs(statistics.median(values)-v['median'][k])<.0011
   assert row['routes'][route][k]==v['median'][k]
 for name,entry in load(p/'repo/source-files.json')['files'].items():assert digest(p/'repo/app'/name)==entry['sha256']
 if frame=='marionette':
  package=load(p/'repo/app/package.json');lock=load(p/'repo/app/package-lock.json')
  assert package['dependencies']['marionette']=='5.1.0' and package['dependencies']['@mnjs/html']=='1.0.0'
  assert lock['packages']['node_modules/marionette']['version']=='5.1.0'
  assert not any(str(v.get('resolved','')).startswith('file:') for v in lock['packages'].values())
assert samples==720
loc=load(R/'analysis/loc/metrics.json');inputs=load(R/'analysis/loc/inputs.json');assert len(loc['builds'])==len(inputs['builds'])==24
selected=0
for b in loc['builds']:
 assert b['status']=='complete';row=next(x for x in rows if x['framework']==b['framework'] and x['build']==b['build']);assert row['sourceSize']['normalizedNonblankLoc']==b['normalizedNonblankLoc']
 assert sum(f['normalizedNonblankLoc'] for f in b['files'])==b['normalizedNonblankLoc']
 for f in b['files']:
  original=R/b['framework']/b['build']/'repo/app'/f['path'];normalized=R/'analysis/loc/normalized'/b['framework']/b['build']/f['path']
  assert digest(original)==f['originalSha256'] and digest(normalized)==f['normalizedSha256']
  assert sum(bool(l.strip()) for l in normalized.read_text().split('\n'))==f['normalizedNonblankLoc'];selected+=1
assert selected==221
assert next(x for x in loc['builds'] if x['framework']=='sveltekit' and x['build']=='b2')['normalizedNonblankLoc']==946
csvrows=list(csv.DictReader((R/'metrics.csv').open()));assert len(csvrows)==144
for r in csvrows:
 row=next(x for x in rows if x['framework']==r['framework'] and x['build']==r['build']);assert float(r['generationSeconds'])==row['generationSeconds']
 for k in metrics:assert float(r[k])==row['routes'][r['route']][k]
for frame in frameworks:
 group=[r for r in rows if r['framework']==frame];assert len(group)==4
 print(frame,'n=4','native-generation-median',round(statistics.median(x['generationSeconds'] for x in group),6),'normalized-LOC-median',statistics.median(x['sourceSize']['normalizedNonblankLoc'] for x in group))
print(f'PASS: 24 apps, 1296 passing test cases, {samples} samples, 144 route-median sets, {selected} normalized files, {len(manifest["files"])} file hashes.')
