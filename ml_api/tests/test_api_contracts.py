from fastapi.testclient import TestClient

import ml_api.main as main


def test_health_endpoint_shape() -> None:
    client = TestClient(main.app)
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert "models_dir" in body


def test_models_endpoint_contains_status_and_versions() -> None:
    client = TestClient(main.app)
    res = client.get("/models")
    assert res.status_code == 200
    body = res.json()
    assert "status" in body
    assert "versions" in body
    assert isinstance(body["status"], dict)
    assert isinstance(body["versions"], dict)


def test_predict_route_requires_api_key_when_enabled() -> None:
    client = TestClient(main.app)
    old_key = main.ML_API_KEY
    try:
        main.ML_API_KEY = "test-key"
        res = client.post(
            "/predict/donor-churn",
            json={"as_of": "2026-01-01", "supporters": [], "donations": []},
        )
        assert res.status_code == 401
    finally:
        main.ML_API_KEY = old_key
