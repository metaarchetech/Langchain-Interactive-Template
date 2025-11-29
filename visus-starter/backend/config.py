import os
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv()


def _validate_openai_key(raw_key: str) -> str:
	"""
	Validate OPENAI_API_KEY presence and ensure it's not a placeholder.
	Returns the normalized key string.
	"""
	if raw_key is None or raw_key.strip() == "":
		raise RuntimeError(
			"Missing OPENAI_API_KEY.\n"
			"Create backend/.env and set:\n"
			"OPENAI_API_KEY=sk-... (your real key)"
		)
	key = raw_key.strip().strip('"').strip("'")
	# Basic placeholder detection and format hint
	if key.startswith("your_") or "api_key_here" in key or not key.startswith("sk-"):
		raise RuntimeError(
			"Invalid OPENAI_API_KEY detected. Replace the placeholder with your real key "
			"that starts with 'sk-'."
		)
	return key


OPENAI_API_KEY = _validate_openai_key(os.getenv("OPENAI_API_KEY"))


