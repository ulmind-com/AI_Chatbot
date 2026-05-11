from googlesearch import search
import json

def do_search(q):
    results = []
    for i in search(q, num_results=3, advanced=True):
        results.append(f"{i.title}: {i.description}")
    return json.dumps(results)

print(do_search("who is the pm of india?"))
