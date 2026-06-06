from fastapi import FastAPI
from pydantic import BaseModel
import re
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util
import torch
from shield import is_structural_garbage

# 1. Initialize FastAPI App
app = FastAPI(title="Smart FAQ Microservice")

# 2. Load AI Models at Startup
print("Loading Noise Filter AI...")
classifier = pipeline("zero-shot-classification", model="valhalla/distilbart-mnli-12-1")

print("Loading Search Vector AI...")
search_model = SentenceTransformer('all-MiniLM-L6-v2')

# Mock Database
faq_database = [
    {"question": "How do I create a feature branch in Git?", "answer": "Use git checkout -b branch-name.", "phase": "bronze"},
    {"question": "How do I lock package versions?", "answer": "Run pip freeze > requirements.txt.", "phase": "bronze"},
    {"question": "How do I deploy an API to AWS EC2?", "answer": "Set up a Docker container and expose port 8000.", "phase": "silver"},
    {"question": "How do I set up a CI/CD pipeline?", "answer": "Use GitHub Actions with workflow YAML files.", "phase": "gold"}
]

# Pre-calculate reference math vectors
faq_embeddings = search_model.encode([faq["question"] for faq in faq_database], convert_to_tensor=True)

class QuestionInput(BaseModel):
    text: str

class SearchInput(BaseModel):
    query: str
    phase: str 

# ENDPOINT 1: THE PERFECT NOISE, TOXICITY & RELEVANCY FILTER
@app.post("/api/v1/validate")
def validate_user_question(data: QuestionInput):
    text = data.text.strip()
    
    # 1. Fast Structural Shield
    is_garbage, shield_reason = is_structural_garbage(text)
    if is_garbage:
        return {"valid": False, "reason": shield_reason}
    
    # 2. AI Zero-Shot Classifier
    labels = [
        "legitimate inquiry or help request", 
        "toxic insult or abuse", 
        "random keyboard smash or gibberish",
        "irrelevant statement or meaningless text"
    ]
    ai_result = classifier(text, candidate_labels=labels)
    top_label = ai_result['labels'][0]
    
    # 3. Decision Matrix
    if top_label == "random keyboard smash or gibberish":
        return {"valid": False, "reason": "Unreadable gibberish noise detected."}
    elif top_label == "toxic insult or abuse":
        return {"valid": False, "reason": "Inappropriate language or abusive behavior detected."}
    elif top_label == "irrelevant statement or meaningless text":
        return {"valid": False, "reason": "Input is a random statement, not a valid FAQ question or request for help."}
    elif top_label == "legitimate inquiry or help request":
        return {"valid": True, "reason": "Input accepted successfully."}
    else:
        return {"valid": False, "reason": "Could not verify this input as a valid question."}


# ENDPOINT 2: SMART INTENT SEARCH (Actual Vector Slicing Logic)
@app.post("/api/v1/search")
def smart_intent_search(data: SearchInput):
    query = data.query.strip()
    user_phase = data.phase.lower()
    
    # 1. Map hierarchy tiers
    allowed_phases = ["bronze"]
    if user_phase == "silver":
        allowed_phases = ["bronze", "silver"]
    elif user_phase == "gold":
        allowed_phases = ["bronze", "silver", "gold"]

    # 2. Find matching indices
    matched_indices = [i for i, faq in enumerate(faq_database) if faq["phase"] in allowed_phases]
    if not matched_indices:
        return {"recommendations": []}
        
    # 3. Optimized Tensor Slicing & Matching
    sliced_embeddings = faq_embeddings[matched_indices]
    query_embedding = search_model.encode(query, convert_to_tensor=True)
    cos_scores = util.cos_sim(query_embedding, sliced_embeddings)[0]
    
    # 4. Filter by strict 0.45 Threshold Gate
    recommendations = []
    for sub_idx, score in enumerate(cos_scores):
        score_val = float(score)
        if score_val >= 0.45:
            # Map back to real database index location
            real_db_idx = matched_indices[sub_idx]
            original_faq = faq_database[real_db_idx]
            
            recommendations.append({
                "faq_id": real_db_idx,
                "question": original_faq["question"],
                "answer": original_faq["answer"],
                "similarity_score": score_val
            })
            
    return {"recommendations": recommendations}