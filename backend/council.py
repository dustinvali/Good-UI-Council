"""3-stage LLM Council orchestration."""

from typing import List, Dict, Any, Tuple, Optional
from .openrouter import query_models_parallel, query_model
from .config import COUNCIL_MODELS, CHAIRMAN_MODEL


def build_message_content(text: str, attachments: List[Dict[str, Any]] = None) -> Any:
    """
    Build message content with optional attachments.

    For multimodal models, includes images as base64. Text files are included in the text content.

    Args:
        text: The text message
        attachments: List of attachment dicts with name, type, isImage, content

    Returns:
        Either a string or a list of content parts for multimodal
    """
    if not attachments:
        return text

    # Separate images and text files
    images = [a for a in attachments if a.get('isImage')]
    text_files = [a for a in attachments if not a.get('isImage')]

    # Add text file contents to the message text
    if text_files:
        file_context = "\n\n--- Attached Files ---\n"
        for f in text_files:
            file_context += f"\n[{f['name']}]\n{f['content']}\n"
        text = text + file_context

    # If no images, return as plain text
    if not images:
        return text

    # Build multimodal content array
    content = [{"type": "text", "text": text}]
    for img in images:
        # Extract base64 data from data URL
        # Format: data:image/png;base64,xxxx
        content.append({
            "type": "image_url",
            "image_url": {"url": img['content']}
        })

    return content


def build_conversation_history(messages: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """
    Convert stored conversation messages to LLM API format.

    Args:
        messages: List of stored messages (user messages have 'content',
                  assistant messages have 'stage1', 'stage2', 'stage3')

    Returns:
        List of messages in LLM API format (role + content)
    """
    history = []
    for msg in messages:
        if msg["role"] == "user":
            history.append({"role": "user", "content": msg["content"]})
        elif msg["role"] == "assistant":
            # Use the stage3 final synthesis as the assistant's response
            stage3 = msg.get("stage3", {})
            content = stage3.get("response", "")
            if content:
                history.append({"role": "assistant", "content": content})
    return history


async def stage1_collect_responses(
    user_query: str,
    council_models: Optional[List[str]] = None,
    attachments: List[Dict[str, Any]] = None,
    conversation_history: List[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Stage 1: Collect individual responses from all council models.

    Args:
        user_query: The user's question
        council_models: List of models to use (defaults to COUNCIL_MODELS)
        attachments: Optional list of file attachments
        conversation_history: Previous messages in the conversation (stored format)

    Returns:
        List of dicts with 'model' and 'response' keys
    """
    models = council_models or COUNCIL_MODELS
    content = build_message_content(user_query, attachments)

    # Build messages array with conversation history
    messages = []
    if conversation_history:
        messages = build_conversation_history(conversation_history)
    messages.append({"role": "user", "content": content})

    # Query all models in parallel
    responses = await query_models_parallel(models, messages)

    # Format results
    stage1_results = []
    for model, response in responses.items():
        if response is not None:  # Only include successful responses
            stage1_results.append({
                "model": model,
                "response": response.get('content', '')
            })

    return stage1_results


async def stage2_collect_rankings(
    user_query: str,
    stage1_results: List[Dict[str, Any]],
    council_models: Optional[List[str]] = None
) -> Tuple[List[Dict[str, Any]], Dict[str, str]]:
    """
    Stage 2: Each model ranks the anonymized responses.

    Args:
        user_query: The original user query
        stage1_results: Results from Stage 1
        council_models: List of models to use (defaults to COUNCIL_MODELS)

    Returns:
        Tuple of (rankings list, label_to_model mapping)
    """
    models = council_models or COUNCIL_MODELS
    # Create anonymized labels for responses (Response A, Response B, etc.)
    labels = [chr(65 + i) for i in range(len(stage1_results))]  # A, B, C, ...

    # Create mapping from label to model name
    label_to_model = {
        f"Response {label}": result['model']
        for label, result in zip(labels, stage1_results)
    }

    # Build the ranking prompt
    responses_text = "\n\n".join([
        f"Response {label}:\n{result['response']}"
        for label, result in zip(labels, stage1_results)
    ])

    ranking_prompt = f"""You are evaluating different responses to the following question:

Question: {user_query}

Here are the responses from different models (anonymized):

{responses_text}

Your task:
1. First, evaluate each response individually. For each response, explain what it does well and what it does poorly.
2. Then, at the very end of your response, provide a final ranking.

IMPORTANT: Your final ranking MUST be formatted EXACTLY as follows:
- Start with the line "FINAL RANKING:" (all caps, with colon)
- Then list the responses from best to worst as a numbered list
- Each line should be: number, period, space, then ONLY the response label (e.g., "1. Response A")
- Do not add any other text or explanations in the ranking section

Example of the correct format for your ENTIRE response:

Response A provides good detail on X but misses Y...
Response B is accurate but lacks depth on Z...
Response C offers the most comprehensive answer...

FINAL RANKING:
1. Response C
2. Response A
3. Response B

Now provide your evaluation and ranking:"""

    messages = [{"role": "user", "content": ranking_prompt}]

    # Get rankings from all council models in parallel
    responses = await query_models_parallel(models, messages)

    # Format results
    stage2_results = []
    for model, response in responses.items():
        if response is not None:
            full_text = response.get('content', '')
            parsed = parse_ranking_from_text(full_text)
            stage2_results.append({
                "model": model,
                "ranking": full_text,
                "parsed_ranking": parsed
            })

    return stage2_results, label_to_model


async def stage3_synthesize_final(
    user_query: str,
    stage1_results: List[Dict[str, Any]],
    stage2_results: List[Dict[str, Any]],
    chairman_model: Optional[str] = None,
    conversation_history: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Stage 3: Chairman synthesizes final response.

    Args:
        user_query: The original user query
        stage1_results: Individual model responses from Stage 1
        stage2_results: Rankings from Stage 2
        chairman_model: The model to use for synthesis (defaults to CHAIRMAN_MODEL)
        conversation_history: Previous messages in the conversation (stored format)

    Returns:
        Dict with 'model' and 'response' keys
    """
    model = chairman_model or CHAIRMAN_MODEL
    # Build comprehensive context for chairman
    stage1_text = "\n\n".join([
        f"Model: {result['model']}\nResponse: {result['response']}"
        for result in stage1_results
    ])

    stage2_text = "\n\n".join([
        f"Model: {result['model']}\nRanking: {result['ranking']}"
        for result in stage2_results
    ])

    # Build conversation context if there's history
    conversation_context = ""
    if conversation_history:
        history = build_conversation_history(conversation_history)
        if history:
            conversation_context = "CONVERSATION HISTORY:\n"
            for msg in history:
                role = "User" if msg["role"] == "user" else "Assistant"
                conversation_context += f"{role}: {msg['content']}\n\n"
            conversation_context += "---\n\n"

    chairman_prompt = f"""You are the Chairman of an LLM Council. Multiple AI models have provided responses to a user's question, and then ranked each other's responses.

{conversation_context}Current Question: {user_query}

STAGE 1 - Individual Responses:
{stage1_text}

STAGE 2 - Peer Rankings:
{stage2_text}

Your task as Chairman is to synthesize all of this information into a single, comprehensive, accurate answer to the user's question. Consider:
- The individual responses and their insights
- The peer rankings and what they reveal about response quality
- Any patterns of agreement or disagreement
- The conversation history for context (if any)

Provide a clear, well-reasoned final answer that represents the council's collective wisdom:"""

    messages = [{"role": "user", "content": chairman_prompt}]

    # Query the chairman model
    response = await query_model(model, messages)

    if response is None:
        # Fallback if chairman fails
        return {
            "model": model,
            "response": "Error: Unable to generate final synthesis."
        }

    return {
        "model": model,
        "response": response.get('content', '')
    }


def parse_ranking_from_text(ranking_text: str) -> List[str]:
    """
    Parse the FINAL RANKING section from the model's response.

    Args:
        ranking_text: The full text response from the model

    Returns:
        List of response labels in ranked order
    """
    import re

    # Look for "FINAL RANKING:" section (case-insensitive)
    ranking_text_upper = ranking_text.upper()
    if "FINAL RANKING:" in ranking_text_upper:
        # Find the position and extract everything after
        pos = ranking_text_upper.find("FINAL RANKING:")
        ranking_section = ranking_text[pos + len("FINAL RANKING:"):]

        # Try to extract numbered list format (e.g., "1. Response A")
        numbered_matches = re.findall(r'\d+\.\s*Response [A-Z]', ranking_section, re.IGNORECASE)
        if numbered_matches:
            # Extract just the "Response X" part and normalize
            return [re.search(r'Response [A-Z]', m, re.IGNORECASE).group().title() for m in numbered_matches]

        # Fallback: Extract all "Response X" patterns in the ranking section only
        matches = re.findall(r'Response [A-Z]', ranking_section, re.IGNORECASE)
        if matches:
            return [m.title() for m in matches]

    # If no FINAL RANKING section found, return empty list
    # Models are explicitly instructed to include this section
    return []


def calculate_aggregate_rankings(
    stage2_results: List[Dict[str, Any]],
    label_to_model: Dict[str, str]
) -> List[Dict[str, Any]]:
    """
    Calculate aggregate rankings across all models.

    Args:
        stage2_results: Rankings from each model
        label_to_model: Mapping from anonymous labels to model names

    Returns:
        List of dicts with model name and average rank, sorted best to worst
    """
    from collections import defaultdict

    # Track positions for each model
    model_positions = defaultdict(list)

    for ranking in stage2_results:
        ranking_text = ranking['ranking']

        # Parse the ranking from the structured format
        parsed_ranking = parse_ranking_from_text(ranking_text)

        for position, label in enumerate(parsed_ranking, start=1):
            if label in label_to_model:
                model_name = label_to_model[label]
                model_positions[model_name].append(position)

    # Calculate average position for each model
    aggregate = []
    for model, positions in model_positions.items():
        if positions:
            avg_rank = sum(positions) / len(positions)
            aggregate.append({
                "model": model,
                "average_rank": round(avg_rank, 2),
                "rankings_count": len(positions)
            })

    # Sort by average rank (lower is better)
    aggregate.sort(key=lambda x: x['average_rank'])

    return aggregate


# Model used for title generation (fast and cheap)
TITLE_GENERATION_MODEL = "google/gemini-2.5-flash"


async def generate_conversation_title(user_query: str) -> str:
    """
    Generate a short title for a conversation based on the first user message.

    Args:
        user_query: The first user message

    Returns:
        A short title (3-5 words)
    """
    title_prompt = f"""Generate a very short title (3-5 words maximum) that summarizes the following question.
The title should be concise and descriptive. Do not use quotes or punctuation in the title.

Question: {user_query}

Title:"""

    messages = [{"role": "user", "content": title_prompt}]

    # Use a fast model for title generation
    response = await query_model(TITLE_GENERATION_MODEL, messages, timeout=30.0)

    if response is None:
        # Fallback to a generic title
        return "New Conversation"

    title = response.get('content', 'New Conversation').strip()

    # Clean up the title - remove quotes, limit length
    title = title.strip('"\'')

    # Truncate if too long
    if len(title) > 50:
        title = title[:47] + "..."

    return title


async def run_full_council(
    user_query: str,
    council_models: Optional[List[str]] = None,
    chairman_model: Optional[str] = None,
    attachments: List[Dict[str, Any]] = None,
    conversation_history: List[Dict[str, Any]] = None
) -> Tuple[List, List, Dict, Dict]:
    """
    Run the complete 3-stage council process.

    Args:
        user_query: The user's question
        council_models: Optional list of models to use for the council
        chairman_model: Optional model to use for the chairman
        attachments: Optional list of file attachments
        conversation_history: Previous messages in the conversation (stored format)

    Returns:
        Tuple of (stage1_results, stage2_results, stage3_result, metadata)
    """
    # Stage 1: Collect individual responses
    stage1_results = await stage1_collect_responses(user_query, council_models, attachments, conversation_history)

    # If no models responded successfully, return error
    if not stage1_results:
        return [], [], {
            "model": "error",
            "response": "All models failed to respond. Please try again."
        }, {}

    # Stage 2: Collect rankings
    stage2_results, label_to_model = await stage2_collect_rankings(user_query, stage1_results, council_models)

    # Calculate aggregate rankings
    aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)

    # Stage 3: Synthesize final answer
    stage3_result = await stage3_synthesize_final(
        user_query,
        stage1_results,
        stage2_results,
        chairman_model,
        conversation_history
    )

    # Prepare metadata
    metadata = {
        "label_to_model": label_to_model,
        "aggregate_rankings": aggregate_rankings
    }

    return stage1_results, stage2_results, stage3_result, metadata
