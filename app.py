
import os
import requests
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

MYMEMORY_API = "https://api.mymemory.translated.net/get"
REQUEST_TIMEOUT = 20

# Supported language names and their API codes.
LANGUAGES = {
    "english": "en",
    "urdu": "ur",
    "arabic": "ar",
    "hindi": "hi",
    "french": "fr",
    "spanish": "es",
    "german": "de",
    "italian": "it",
    "portuguese": "pt",
    "russian": "ru",
    "chinese": "zh-CN",
    "japanese": "ja",
    "korean": "ko",
    "turkish": "tr",
    "persian": "fa",
    "farsi": "fa",
    "bengali": "bn",
    "punjabi": "pa",
    "dutch": "nl",
    "greek": "el",
    "hebrew": "he",
    "indonesian": "id",
    "malay": "ms",
    "thai": "th",
    "vietnamese": "vi",
    "polish": "pl",
    "ukrainian": "uk",
    "swedish": "sv",
    "danish": "da",
    "norwegian": "no",
    "finnish": "fi",
    "romanian": "ro",
    "czech": "cs",
    "hungarian": "hu",
    "filipino": "tl",
    "swahili": "sw",
}


def normalize_language(language):
    """Convert a language name or code into an API language code."""
    if not language:
        return None

    value = str(language).strip()
    lower = value.lower()

    if lower in ("auto", "automatic", "detect", "detect language"):
        return None

    if lower in LANGUAGES:
        return LANGUAGES[lower]

    # Allow codes such as en, ur, and zh-CN.
    valid_codes = set(LANGUAGES.values())

    if value.lower() in {code.lower() for code in valid_codes}:
        for code in valid_codes:
            if code.lower() == value.lower():
                return code

    return None


def translate_text(text, source_language, target_language):
    """Translate using the explicitly selected language pair."""
    params = {
        "q": text,
        "langpair": f"{source_language}|{target_language}",
    }

    response = requests.get(
        MYMEMORY_API,
        params=params,
        timeout=REQUEST_TIMEOUT,
        headers={"User-Agent": "TranslateAI/1.0"},
    )

    response.raise_for_status()
    data = response.json()

    if data.get("responseStatus", 200) != 200:
        message = data.get("responseDetails") or "Translation service returned an error."
        raise ValueError(str(message))

    translated_text = data.get("responseData", {}).get("translatedText", "")

    if not translated_text:
        raise ValueError("The translation service returned an empty result.")

    return translated_text


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/translate", methods=["POST"])
def translate():
    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            data = request.form.to_dict()

        text = (
            data.get("text")
            or data.get("message")
            or data.get("input")
            or data.get("source_text")
            or ""
        )

        source_value = (
            data.get("source")
            or data.get("source_lang")
            or data.get("from")
            or data.get("sourceLanguage")
            or ""
        )

        target_value = (
            data.get("target")
            or data.get("target_lang")
            or data.get("to")
            or data.get("targetLanguage")
            or ""
        )

        text = str(text).strip()

        if not text:
            return jsonify({
                "success": False,
                "error": "Please enter text to translate."
            }), 400

        source_language = normalize_language(source_value)
        target_language = normalize_language(target_value)

        if not source_language:
            return jsonify({
                "success": False,
                "error": "Please select the language you are writing in."
            }), 400

        if not target_language:
            return jsonify({
                "success": False,
                "error": "Please select the language you want to translate into."
            }), 400

        if source_language == target_language:
            return jsonify({
                "success": True,
                "original_text": text,
                "translated_text": text,
                "translation": text,
                "source_language": source_language,
                "target_language": target_language,
            })

        translated_text = translate_text(
            text,
            source_language,
            target_language,
        )

        return jsonify({
            "success": True,
            "original_text": text,
            "translated_text": translated_text,
            "translation": translated_text,
            "source_language": source_language,
            "target_language": target_language,
        })

    except requests.Timeout:
        return jsonify({
            "success": False,
            "error": "Translation timed out. Check your internet connection and try again."
        }), 504

    except requests.RequestException:
        return jsonify({
            "success": False,
            "error": "Could not connect to MyMemory. Check your internet connection and try again."
        }), 502

    except ValueError as error:
        return jsonify({
            "success": False,
            "error": str(error)
        }), 400

    except Exception:
        app.logger.exception("Unexpected translation error")
        return jsonify({
            "success": False,
            "error": "An unexpected error occurred. Please try again."
        }), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "app": "TranslateAI"
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="127.0.0.1", port=port, debug=False)
