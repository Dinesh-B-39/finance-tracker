from flask import Flask, jsonify, request
import google.generativeai as genai
from flask_cors import CORS  # ✅ NEW

app = Flask(__name__)
CORS(app)

# Configure Gemini with your API key
api_key = "AIzaSyBNBgchXs6MmOx-lBQSnovzCoyOuC18MY0"
genai.configure(api_key=api_key)

generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    generation_config=generation_config,
    system_instruction=(
        "You are a helpful and knowledgeable personal finance assistant. "
        "You help users track expenses, manage savings, set budgeting goals, "
        "and understand how to improve their financial habits. Provide clear, friendly, and practical advice."
    )
)

history = [
    {"role": "user", "parts": ["hi"]},
    {"role": "model", "parts": ["Hello! I'm your Personal Finance Assistant. How can I help you today?"]}
]

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json['message']
    chat_session = model.start_chat(history=history)
    response = chat_session.send_message(user_message)
    model_response = response.text
    history.append({"role": "user", "parts": [user_message]})
    history.append({"role": "model", "parts": [model_response]})
    return jsonify({"reply": model_response})

if __name__ == '__main__':
    app.run(debug=True)
