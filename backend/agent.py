import os
from typing import Annotated, TypedDict, Dict, Any
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_groq import ChatGroq
from tools import tools
from langgraph.prebuilt import ToolNode, tools_condition
from dotenv import load_dotenv

load_dotenv()

DEBUG = True

class State(TypedDict):
    messages: Annotated[list, add_messages]
    structured_data: Dict[str, Any]
    hcp_id: Any

def get_llm():
    # Use a supported model since gemma2-9b-it is decommissioned
    api_key = os.environ.get("GROQ_API_KEY")
    if DEBUG:
        print(f"[DEBUG] GROQ_API_KEY exists: {bool(api_key)}")
    if not api_key:
        print("Warning: GROQ_API_KEY not found in environment variables.")
    return ChatGroq(model="llama-3.3-70b-versatile", api_key=api_key)

llm = get_llm()
llm_with_tools = llm.bind_tools(tools)

def chatbot(state: State):
    sys_msg = SystemMessage(content=(
        "You are an elite AI CRM assistant for pharmaceutical field representatives. "
        "Your goal is to intelligently help reps log interactions, search HCPs (Healthcare Professionals), "
        "edit interactions, and schedule follow-ups.\n\n"
        "When logging an interaction from chat, intelligently extract: "
        "interaction type, discussion summary, products discussed, "
        "requested actions, follow-up date, and next steps.\n\n"
        "IMPORTANT RULES:\n"
        "1. DO NOT manually output XML or raw function syntax like <function=>. ONLY use the native tool calling feature.\n"
        "2. If an HCP is already selected in the context, DO NOT provide hcp_id to your tools, and DO NOT call search_hcp. The system will automatically inject the hcp_id for you.\n"
        "3. Only call search_hcp if NO HCP is currently selected and you need to look one up.\n"
        "4. NEVER output 'hcp_id': null under any circumstances. Simply omit the field.\n"
        "5. After every successful tool execution, return a short confirmation (e.g., 'Interaction logged successfully. Follow-up scheduled for next Tuesday.').\n"
        "6. Be concise and professional."
    ))
    
    messages = [sys_msg] + state["messages"]
    if DEBUG:
        print(f"[DEBUG] Invoking LLM with messages: {messages}")
    response = llm_with_tools.invoke(messages)
    if DEBUG:
        print(f"[DEBUG] LLM response: {response}")
    
    # Preserve and merge structured data across tool calls
    structured_data = state.get("structured_data", {})
    if hasattr(response, "tool_calls") and response.tool_calls:
        for tc in response.tool_calls:
            # Inject hcp_id if available in state
            if state.get("hcp_id") and tc["name"] in ["log_interaction", "get_interaction_history", "schedule_followup"]:
                tc["args"]["hcp_id"] = state["hcp_id"]
                if DEBUG:
                    print(f"[DEBUG] Injected hcp_id {state['hcp_id']} into {tc['name']}")
                    
            # Merge extracted args into structured data so we don't lose fields
            for key, value in tc["args"].items():
                if value: # Only keep non-empty values
                    structured_data[key] = value
                
    return {"messages": [response], "structured_data": structured_data, "hcp_id": state.get("hcp_id")}

tool_node = ToolNode(tools=tools)

graph_builder = StateGraph(State)
graph_builder.add_node("chatbot", chatbot)
graph_builder.add_node("tools", tool_node)

graph_builder.add_edge(START, "chatbot")
graph_builder.add_conditional_edges(
    "chatbot",
    tools_condition,
)
graph_builder.add_edge("tools", "chatbot")

agent = graph_builder.compile()

def process_chat(message: str, hcp_id: int = None) -> dict:
    """Entry point for the API to interact with the LangGraph agent."""
    initial_messages = []
    if hcp_id:
        initial_messages.append(SystemMessage(content=f"An HCP is currently selected (ID: {hcp_id}). You do NOT need to ask for it or search for it. Omit hcp_id in tool calls, the backend will inject it."))
    
    initial_messages.append(HumanMessage(content=message))
    if DEBUG:
        print(f"[DEBUG] Incoming user message: {message}")
        print(f"[DEBUG] Selected HCP ID: {hcp_id}")
        print("[DEBUG] Invoking LangGraph agent...")
    
    final_state = {"messages": initial_messages, "structured_data": {}, "hcp_id": hcp_id}
    tool_executed = False
    
    try:
        for step in agent.stream({"messages": initial_messages, "structured_data": {}, "hcp_id": hcp_id}, stream_mode="values"):
            if DEBUG:
                print(f"[DEBUG] Node executed. Current state keys: {list(step.keys())}")
            if "messages" in step and step["messages"]:
                last_msg = step["messages"][-1]
                if DEBUG:
                    print(f"[DEBUG] Last message type: {type(last_msg)}")
                if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
                    if DEBUG:
                        print(f"[DEBUG] Tool calls: {last_msg.tool_calls}")
                if type(last_msg).__name__ == "ToolMessage":
                    tool_executed = True
                    if DEBUG:
                        print(f"[DEBUG] Tool output: {last_msg.content}")
            final_state = step
    except Exception as e:
        if DEBUG:
            import traceback
            print(f"[DEBUG] Exception during agent execution: {e}")
            traceback.print_exc()
        # If the interaction has already been saved successfully, do NOT throw an exception afterwards.
        if not tool_executed and not final_state.get("structured_data"):
            raise e
        else:
            if DEBUG:
                print("[DEBUG] Recovering from exception since a tool was successfully executed.")
            
    if DEBUG:
        print(f"[DEBUG] LangGraph agent final state messages count: {len(final_state.get('messages', []))}")
    
    # Get the final AI response safely
    final_message_content = ""
    messages = final_state.get("messages", [])
    if messages:
        last_msg = messages[-1]
        raw_content = getattr(last_msg, "content", "")
        
        # content could be a list, None, or empty string
        if isinstance(raw_content, list):
            texts = [item.get("text", "") for item in raw_content if isinstance(item, dict) and "text" in item]
            final_message_content = " ".join(texts)
        elif isinstance(raw_content, str):
            final_message_content = raw_content
            
    structured_data = final_state.get("structured_data", {})
    
    if not final_message_content or not final_message_content.strip():
        if tool_executed:
            final_message_content = "Interaction logged successfully."
        else:
            final_message_content = "Interaction processed."
        
    return {
        "response": final_message_content,
        "structured_data": structured_data
    }
