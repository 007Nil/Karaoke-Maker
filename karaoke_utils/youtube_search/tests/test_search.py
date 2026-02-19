from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

MOCK_RESULTS = {
    "result": [
        {
            "id": "abc123",
            "title": "Test Song",
            "link": "https://www.youtube.com/watch?v=abc123",
            "thumbnails": [{"url": "https://example.com/thumb.jpg"}],
            "viewCount": {"text": "1,000,000 views"},
        }
    ]
}


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@patch("main.VideosSearch")
def test_search_returns_results(mock_videos_search):
    mock_instance = MagicMock()
    mock_instance.result.return_value = MOCK_RESULTS
    mock_videos_search.return_value = mock_instance

    response = client.get("/search?query=test+song")

    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) == 1
    assert data["results"][0]["id"] == "abc123"
    mock_videos_search.assert_called_once_with("test song", limit=20)


@patch("main.VideosSearch")
def test_search_empty_results(mock_videos_search):
    mock_instance = MagicMock()
    mock_instance.result.return_value = {"result": []}
    mock_videos_search.return_value = mock_instance

    response = client.get("/search?query=nothing")
    assert response.status_code == 200
    assert response.json() == {"results": []}


def test_search_missing_query():
    response = client.get("/search")
    assert response.status_code == 422


def test_search_empty_query():
    response = client.get("/search?query=")
    assert response.status_code == 422


@patch("main.VideosSearch")
def test_search_upstream_error(mock_videos_search):
    mock_videos_search.side_effect = Exception("network error")

    response = client.get("/search?query=test")
    assert response.status_code == 500
    assert "network error" in response.json()["detail"]
