"""Restore the inherited fixture stylesheet only at explicitly listed app paths."""
import hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parent
repo=root.parent.parent
source=repo/'template/design/tokens.css'
data=source.read_bytes()
digest=hashlib.sha256(data).hexdigest()
assert digest=='eb043fb29db06e0df9f35aedfaefe28e42a205d1384476699ad7b31e0d9f9d03'
count=0
for item in json.loads((root/'provided-stylesheets.json').read_text()):
 assert item['sha256']==digest
 path=(root/item['path']).resolve()
 assert path.is_relative_to(root) and 'repo/app/' in item['path']
 if path.exists():assert path.is_file() and path.read_bytes()==data,'Existing stylesheet differs; no overwrite'
 else:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data);count+=1
print(f'Restored {count} fixture stylesheet references; existing identical files preserved.')
