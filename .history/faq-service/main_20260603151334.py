from fastapi import FastAPI
from pydantic import BaseModel
import re
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util
import torch

# 1. Initialize FastAPI App
app = FastAPI(title="Smart FAQ Microservice")

# 2. Load Free AI Models at Startup
print("Loading Noise Filter AI...")
classifier = pipeline("zero-shot-classification", model="valhalla/distilbart-mnli-12-1")

print("Loading Search Vector AI...")
search_model = SentenceTransformer('all-MiniLM-L6-v2')

# Mock Database
faq_database = [
    "What is the procedure to apply for an internship NOC?",
    "Can I get a stipend during my college summer internship?",
    "Where do I submit the final internship completion certificate?",
    "How many days does it take to process an academic NOC for higher studies?",
    "What happens if I fail to clear the final semester examinations?"
]
faq_embeddings = search_model.encode(faq_database, convert_to_tensor=True)

class QuestionInput(BaseModel):
    text: str

class SearchInput(BaseModel):
    query: str

# ENDPOINT 1: THE NOISE FILTER
@app.post("/api/v1/validate")
def validate_user_question(data: QuestionInput):
    text = data.text.strip()
    if len(text) < 8:
        return {"valid": False, "reason": "Too short to be a valid question."}
    if re.search(r'(.)\1{4,}', text): 
        return {"valid": False, "reason": "Contains repeating gibberish characters."}
    
    labels = ["meaningful question", "gibberish noise junk"]
    ai_result = classifier(text, candidate_labels=labels)
    meaningful_score = ai_result['scores'][ai_result['labels'].index("meaningful question")]
    
    if meaningful_score >= 0.85:
        return {"valid": True, "reason": "Passes safety check."}
    else:
        return {"valid": False, "reason": "AI flagged this as unreadable noise."}

# ENDPOINT 2: SMART INTENT SEARCH
@app.post("/api/v1/search")
def smart_search(data: SearchInput):
    query_embedding = search_model.encode(data.query, convert_to_tensor=True)
    cos_scores = util.cos_sim(query_embedding, faq_embeddings)[0]
    top_results = torch.topk(cos_scores, k=2)
    
    results = []
    for score, idx in zip(top_results[0], top_results[1]):
        results.append({
            "question": faq_database[idx],
            "score": round(float(score), 2)
        })
    return {"results": results}