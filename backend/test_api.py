import requests
import json

url = "http://localhost:8000/api/research"
data = {"query": "What are the latest breakthroughs in fusion energy?"}

print(f"Testing API at {url} with query: {data['query']}")

try:
    response = requests.post(url, json=data, stream=True)
    response.raise_for_status()
    
    for line in response.iter_lines():
        if line:
            print(f"Received: {line.decode('utf-8')}")
            
except Exception as e:
    print(f"Error: {e}")
