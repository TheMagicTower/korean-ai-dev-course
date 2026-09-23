import json,datetime,sys,pathlib
p=pathlib.Path(__file__).with_name('events.jsonl')
with p.open('a') as f:f.write(json.dumps({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'kind':'response','stage':sys.argv[1],'message':sys.argv[2]},ensure_ascii=False)+'\n')
