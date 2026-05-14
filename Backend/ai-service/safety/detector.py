# safety/detector.py
#
# This module is responsible for detecting emotional distress
# in user messages before they reach the LLM.
#
# Based on the thesis paper, the safety check evaluates messages
# for indicators of extreme emotional distress like severe sadness,
# hopelessness, or self-harm expressions. If detected, the message
# is flagged so the LLM responds with safe, non-directive,
# emotionally supportive language instead of general responses.

# Phrases — crisis level
CRISIS_KEYWORDS = [
    # Direct suicide / self-harm phrases
    "i want to kill myself", "i wanna kill myself", "i'm going to kill myself",
    "im going to kill myself", "im gonna kill myself", "i want to die",
    "i wanna die", "i don't want to live anymore", "i dont want to live anymore",
    "i don't wanna live anymore", "i dont wanna live anymore",
    "i wish i was dead", "i want to end my life", "i want everything to end",
    "i feel suicidal", "i'm suicidal", "im suicidal", "i can't go on anymore",
    "i cant go on anymore", "i'm done with life", "im done with life",
    "life is not worth living", "i hate being alive", "i should just die",
    "i want to stop existing", "i'm ready to end it all", "im ready to end it all",
    "i'm planning to kill myself", "im planning to kill myself",
    "i want to hurt myself", "i want to self harm", "i want to self-harm",
    "i cut myself", "i hurt myself on purpose", "i want to overdose",
    "i want to jump off a building", "i want to hang myself",
    "i want to stab myself", "i want to shoot myself", "i want to poison myself",

    # Immediate crisis / emergency signals
    "goodbye everyone", "this is my last message", "i already wrote my note",
    "i'm saying goodbye", "im saying goodbye", "i won't be here tomorrow",
    "i wont be here tomorrow", "i already took pills", "i hurt myself badly",
    "i'm bleeding", "im bleeding", "i'm about to do it", "im about to do it",
    "i'm going to end my life tonight", "im going to end my life tonight",
    "i have a suicide plan", "i have the pills ready", "i have a gun",
    "i'm standing on the edge", "im standing on the edge",
    "i'm ready to die", "im ready to die", "i cannot stay safe",
    "i might hurt myself tonight", "i don't trust myself alone",
    "i dont trust myself alone",

    # Abbreviations / slang / online terms
    "kms", "wanna kms", "imma kms", "unalive myself", "delete myself",
    "finna end it", "i quit life", "im checking out", "i'm checking out",
    "cya forever", "goodbye yall", "final message", "this my last post",
    "sewer slide", "self delete", "off myself", "end myself",
    "disappear forever", "leave this world", "sleep forever",
    "final sleep", "no more tomorrow", "no more me", "lights out for me",
    "game over for me", "might end it tonight", "not surviving this",
    "this is the end",

    # Censored / avoiding detection
    "k1ll myself", "ki11 myself", "d!e", "d13", "sleeping forever sounds nice",

    # Misspellings / typos
    "i wanna kil myself", "i want to di3", "wanna dye", "kmself", "su1cide",
    "sucidal", "i hatemyself", "i dont wana live", "im tierd of life",
    "no reson to live", "i wanna end myslef", "im better off ded",
    "i wish i was gon", "i wana disappear",
]

# Phrases — moderate level
MODERATE_KEYWORDS = [
    # Hopelessness / emotional distress phrases
    "i feel hopeless", "nothing matters anymore", "i can't take this anymore",
    "i cant take this anymore", "i feel empty inside", "i feel trapped",
    "i feel broken", "i have no future", "i feel worthless", "i hate myself",
    "i'm a burden", "im a burden", "nobody cares about me", "i feel alone",
    "i don't belong here", "i dont belong here", "i can't handle life anymore",
    "i cant handle life anymore", "i'm emotionally exhausted",
    "im emotionally exhausted", "i want the pain to stop", "i feel numb",
    "i feel like giving up", "i'm tired of everything", "im tired of everything",
    "i'm suffering too much", "im suffering too much",

    # Slang / online distress terms
    "lowkey wanna die", "id rather be dead", "i'd rather be dead",
    "im done fr", "i'm done fr", "lowkey suicidal", "highkey suicidal",
    "deadass wanna disappear", "im cooked", "cant do this no more",
    "no point anymore", "gg", "im tired boss", "i'm tired boss",

    # Misspellings related to moderate distress
    "depresed", "hopless", "i cant breath", "i feel usless",
]

# Single-word / short-form crisis keywords
CRISIS_SINGLE_KEYWORDS = [
    # Suicide / self-harm
    "suicide", "suicidal", "selfharm", "self-harm",
    "overdose", "overdosing", "cutting",
    "cut", "bleeding", "hang", "hanging",
    "die", "dead", "death", "kms",
    "unalive", "goodbye", "farewell",

    # Severe hopelessness
    "hopeless", "worthless", "burden",
    "useless", "empty", "numb",
    "trapped", "broken",

    # Internet slang / bypass
    "kys", "kmself", "di3",
    "d13", "d!e", "sucidal",
    "su1cide", "ded",

    # Dangerous emotional state
    "ending", "goodbye",
    "disappear", "vanish",
    "destroyed", "doomed",

    # Tagalog
    "mamatay", "magpakamatay",
    "papakamatay", "wakasan",
    "sumuko", "maglaho",
]

# Single-word / short-form moderate distress keywords
MODERATE_SINGLE_KEYWORDS = [
    # Anxiety / stress
    "anxious", "anxiety",
    "stress", "stressed",
    "panic", "panicking",
    "worried", "nervous",
    "afraid", "scared",

    # Sadness / depression
    "depressed", "depression",
    "sad", "crying",
    "lonely", "alone",
    "helpless", "hopeless",
    "tired", "drained",
    "burnout", "exhausted",
    "empty", "numb",
    "broken",

    # Emotional distress
    "overwhelmed", "struggling",
    "failing", "frustrated",
    "disappointed", "stuck",
    "unmotivated", "pressure",
    "rough", "difficult",

    # Gen Z / slang
    "cooked", "spiraling",
    "crashing", "losingit",
    "burnedout",

    # Sleep / energy
    "insomnia", "sleepless",
    "fatigue", "fatigued",

    # Tagalog
    "pagod", "malungkot",
    "naiiyak", "takot",
    "magisa", "nag-iisa",
    "nahihirapan", "problemado",
]


def detect_risk_level(message: str) -> str:
    """
    Analyzes a message and returns a risk level string.

    Returns:
        "crisis"   — message contains self-harm or severe distress language
        "moderate" — message contains emotional distress language
        "safe"     — no distress indicators detected

    Priority order:
        1. Crisis phrases (longest, most specific — checked first)
        2. Crisis single words
        3. Moderate phrases
        4. Moderate single words
    """
    message_lower = message.lower()

    # Check crisis phrases first — highest priority
    for keyword in CRISIS_KEYWORDS:
        if keyword in message_lower:
            return "crisis"

    # Check crisis single words
    for keyword in CRISIS_SINGLE_KEYWORDS:
        if keyword in message_lower:
            return "crisis"

    # Check moderate phrases
    for keyword in MODERATE_KEYWORDS:
        if keyword in message_lower:
            return "moderate"

    # Check moderate single words
    for keyword in MODERATE_SINGLE_KEYWORDS:
        if keyword in message_lower:
            return "moderate"

    # No distress indicators found
    return "safe"


def build_safe_prompt(message: str, risk_level: str) -> str:
    """
    Wraps the user message in a system prompt that guides
    the LLM to respond appropriately based on the risk level.

    Why do we modify the prompt instead of blocking the message?
    Blocking would leave the user without support at the moment
    they need it most. Instead, we guide the LLM to respond
    safely and empathetically while encouraging professional help.
    """

    if risk_level == "crisis":
        system_prompt = """You are a compassionate emotional support assistant
        for university students. The user may be experiencing a crisis.
        Respond with warmth, validate their feelings, and gently encourage
        them to reach out to a counselor or crisis hotline.
        Do NOT provide advice, instructions, or solutions.
        Focus only on emotional validation and safety."""

    elif risk_level == "moderate":
        system_prompt = """You are a compassionate emotional support assistant
        for university students. The user is experiencing emotional distress.
        Respond with empathy, acknowledge their feelings, and provide
        gentle non-directive support. Do not diagnose or prescribe solutions."""

    else:
        system_prompt = """You are a compassionate emotional support assistant
        for university students. Listen actively, respond with empathy,
        and provide supportive non-directive responses."""

    return f"{system_prompt}\n\nStudent: {message}"