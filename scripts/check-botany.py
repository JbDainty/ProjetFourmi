"""Record authoritative GBIF name-match responses, without claiming morphology review."""
import json,urllib.request,urllib.parse,re,datetime,concurrent.futures
text=open('src/data/botany.ts').read()
names=re.findall(r"make\('[^']+','([^']+)'",text)
def match(name):
 url='https://api.gbif.org/v1/species/match?'+urllib.parse.urlencode({'name':name,'strict':'true'})
 try:
  with urllib.request.urlopen(url,timeout=25) as response: data=json.load(response)
  return {'requested':name,'source':url,'checked':datetime.date.today().isoformat(),'scientificName':data.get('scientificName'),'canonicalName':data.get('canonicalName'),'status':data.get('status'),'matchType':data.get('matchType'),'confidence':data.get('confidence'),'usageKey':data.get('usageKey'),'acceptedUsageKey':data.get('acceptedUsageKey'),'family':data.get('family')}
 except Exception as e:return {'requested':name,'source':url,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:results=list(executor.map(match,names))
open('src/data/taxonomy.json','w').write(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
for r in results:print(r['requested'],r.get('matchType',r.get('error')),r.get('status',''),r.get('family',''))
