from duckduckgo_search import DDGS
import json
results = DDGS().text("who is the pm of INDIA?", max_results=3)
print(json.dumps(list(results)))
