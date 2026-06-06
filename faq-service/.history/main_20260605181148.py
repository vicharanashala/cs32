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
def smart_search(data: SearchInput):
    # 1. Map Phase: Find all indices matching the selected phase
    valid_indices = [
        i for i, faq in enumerate(faq_database) 
        if faq.get("phase", "").lower() == data.phase.lower()
    ]
    
    # Safety Check: If your database doesn't have any questions for this phase yet
    if not valid_indices:
        return {"recommendations": [], "message": f"No questions found for the {data.phase} phase."}
    
    # 2. Convert user query to math vectors
    query_embedding = search_model.encode(data.query, convert_to_tensor=True)
    
    # FIX: Slice your main math vectors tensor to ONLY include this phase's vectors
    filtered_embeddings = faq_embeddings[valid_indices]
    
    # 3. Calculate similarity against ONLY the filtered vectors
    cos_scores = util.cos_sim(query_embedding, filtered_embeddings)[0]
    
    # 4. Get closest matches dynamically based on how many items exist in this phase
    k_value = min(2, len(valid_indices))
    top_results = torch.topk(cos_scores, k=k_value)
    
    recommendations = []
    for score, local_idx in zip(top_results[0], top_results[1]):
        # 5. Internal check: Only recommend if the AI is genuinely confident
        if float(score) >= 0.45:
            
            # 6. Index Mapping 
            # Maps the local position back to its true global index position in faq_database
            global_idx = valid_indices[int(local_idx)]
            recommendations.append(faq_database[global_idx])
            
    return {"recommendations": recommendations}