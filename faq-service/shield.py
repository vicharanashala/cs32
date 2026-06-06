# faq_service/shield.py
import re
import unicodedata

# Top English bigrams to instantly separate real words from random keyboard rows
_COMMON_BIGRAMS = frozenset(
    {
        "th", "he", "in", "er", "an", "re", "on", "en", "at", "es",
        "ed", "nd", "to", "or", "ea", "ti", "ar", "te", "ng", "al",
        "it", "as", "is", "ha", "et", "se", "ou", "of", "le", "sa",
        "ve", "ro", "hi", "ri", "ic", "ne", "st", "li", "de", "ra",
        "ld", "ur", "ce", "co", "no", "me", "io", "ly", "si", "gh",
        "ow", "nt", "tr", "pr", "ll", "ss", "sh", "ge", "ni", "la",
        "un", "wh", "pa", "ma", "ca", "pe", "di", "ho", "ta", "wi",
        "be", "fo", "ac", "wa", "ct", "mi", "ag", "el", "om", "us",
        "il", "do", "we", "ns", "pl", "fe", "lo", "so", "ru", "pu",
        "pi", "ab", "po", "ch", "bi", "su", "na", "fi", "ad", "mo",
        "sp", "qu", "ev", "bo", "sc", "gr", "bu", "cl", "if", "go",
        "tu", "am", "by", "op", "fa", "im", "wr", "wo", "ys",
    }
)

def _normalise(text: str) -> str:
    """Standardizes incoming text string geometry."""
    text = unicodedata.normalize("NFKD", text.lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", text).strip()

def _alpha_only(text: str) -> str:
    """Removes spaces, punctuation, and digits to evaluate raw character strings."""
    return re.sub(r"[^a-z]", "", text.lower())

def calculate_bigram_spam_score(alpha: str) -> float:
    """Measures the mathematical proportion of unrecognized bigrams."""
    if len(alpha) < 4:
        return 0.0
    bigrams = [alpha[i : i + 2] for i in range(len(alpha) - 1)]
    if not bigrams:
        return 0.0
    unknown = sum(1 for bg in bigrams if bg not in _COMMON_BIGRAMS)
    return unknown / len(bigrams)

def is_structural_garbage(text: str) -> tuple[bool, str | None]:
    """
    Evaluates input metrics before passing to the zero-shot classifier.
    Returns (True, reason) if it's obvious trash, or (False, None) if clean.
    """
    norm = _normalise(text)
    alpha = _alpha_only(norm)
    words = norm.split()

    # 1. Base length constraints
    if len(text) < 20 or len(words) < 4:
        return True, "Input is too short to express a meaningful question statement."

    if alpha:
        # 2. Unique character distribution test ("abababab" vs normal English vocabulary)
        unique_ratio = len(set(alpha)) / len(alpha)
        if unique_ratio < 0.25:
            return True, "Rejected: Failed character distribution variety check (potential spam)."

        # 3. Monotonous single character repetition test ("aaaaaaaaaaa")
        freq = {c: alpha.count(c) for c in set(alpha)}
        max_freq = max(freq.values()) if freq else 0
        if (max_freq / len(alpha)) > 0.40:
            return True, "Rejected: Dominant single character exceeds safety threshold."

    # 4. Runaway consecutive characters test ("helllllp", "nooooooo")
    max_run = max((len(m.group()) for m in re.finditer(r"(.)\1+", text.lower())), default=0)
    if max_run > 4:
        return True, "Rejected: Excessive consecutive repeated characters detected."

    # 5. Semantic Bigram Frequency Filter (Catches "hjsfgaydhshdb")
    if len(alpha) >= 6:
        spam_score = calculate_bigram_spam_score(alpha)
        if spam_score > 0.55:
            return True, "Rejected: Unreadable text geometry (keyboard smash layout)."

    return False, None