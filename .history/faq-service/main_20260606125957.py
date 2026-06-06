from fastapi import FastAPI
from pydantic import BaseModel
import re
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util
import torch
from shield import is_structural_garbage

# 1. Initialize FastAPI App
app = FastAPI(title="Smart FAQ Microservice")

# 2. Load Free AI Models at Startup
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

# FIX: Extract only the text questions for the AI to calculate math vectors
faq_embeddings = search_model.encode([faq["question"] for faq in faq_database], convert_to_tensor=True)

class QuestionInput(BaseModel):
    text: str

class SearchInput(BaseModel):
    query: str
    phase: str # Accepts "bronze", "silver", or "gold"

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

# ENDPOINT 2: SMART INTENT SEARCH (Clean Recommendation Output)
@app.post("/api/v1/search")
def test_search_successful_gold_phase():
    """Verifies valid phase-aware queries pass the 0.45 threshold loop."""
    payload = {
        "query": "How do I deploy docker container on AWS?",
        "phase": "Gold"
    }
    response = client.post("/api/v1/search", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    # Unpack the recommendations wrapper
    assert "recommendations" in data
    results = data["recommendations"]
    assert isinstance(results, list)
    
    # Verify math threshold and index mapping integrity
    for item in results:
        score = item.get("similarity_score") or item.get("score")
        assert score >= 0.45, f"Threshold breach! Found score: {score}"
        assert "faq_id" in item or "id" in item


def test_search_gated_by_strict_threshold():
    """Verifies completely irrelevant queries return a clean empty list."""
    payload = {
        "query": "What is the recipe for baking chocolate chip cookies?",
        "phase": "Bronze"
    }
    response = client.post("/api/v1/search", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    # Unpack the recommendations wrapper
    assert "recommendations" in data
    results = data["recommendations"]
    
    assert len(results) == 0, "Gate failed: Irrelevant query leaked through threshold!"