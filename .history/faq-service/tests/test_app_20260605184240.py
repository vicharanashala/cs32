import pytest
from fastapi.testclient import TestClient
from faq_service.main import app 

client = TestClient(app)

# ENDPOINT 1: /api/v1/validate (Content Filter & Shield Tests)

@pytest.mark.parametrize(
    "input_text, expected_valid, case_description",
    [
        ("hjsfgaydhshdb", False, "Case 1: Keyboard smash (Caught by shield)"),
        ("hell you are this", False, "Case 2: Abuse/Trolling (Caught by AI)"),
        ("keepe I knew it to answer whom", False, "Case 3: Meaningless text (Caught by AI)"),
        ("how deployed docker aws i not know help", True, "Case 4: Broken grammar with valid intent"),
    ]
)
def test_validate_endpoint_buckets(input_text, expected_valid, case_description):
    """Verifies all 4 input cases hit the correct validation status."""
    response = client.post("/api/v1/validate", json={"text": input_text})
    assert response.status_code == 200
    
    data = response.json()
    assert data["valid"] == expected_valid, f"Failed: {case_description}"
    assert "reason" in data
    
    # Security Check: Ensure internal AI confidence math is completely hidden
    assert "score" not in data
    assert "logits" not in data


# ENDPOINT 2: /api/v1/search (Smart Vector Search Tests)

def test_search_successful_gold_phase():
    """Verifies valid phase-aware queries pass the 0.45 threshold loop."""
    payload = {
        "query": "How do I deploy docker container on AWS?",
        "phase": "Gold"
    }
    response = client.post("/api/v1/search", json=payload)
    assert response.status_code == 200
    
    results = response.json()
    assert isinstance(results, list)
    
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
    
    results = response.json()
    assert len(results) == 0, "Gate failed: Irrelevant query leaked through threshold!"