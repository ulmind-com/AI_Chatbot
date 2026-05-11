from duckduckgo_search import DDGS
import json

def search(query):
    try:
        results = DDGS().text(query, max_results=3)
        return json.dumps(results)
    except Exception as e:
        return str(e)

print(search("who is the pm of INDIA?"))
