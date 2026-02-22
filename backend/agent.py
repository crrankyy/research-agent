import os
from openai import OpenAI
from tools import search_web, search_arxiv
from dotenv import load_dotenv

load_dotenv()

class ResearchAgent:
    def __init__(self, api_key: str | None = None):
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key or os.getenv("OPENROUTER_API_KEY"),
            default_headers={
                "HTTP-Referer": "http://localhost:5176",
                "X-Title": "Socratic Research Agent",
            }
        )        # Models
        self.planning_model = "arcee-ai/trinity-large-preview:free"
        self.synthesis_model = "arcee-ai/trinity-large-preview:free"

    def _determine_search_needs(self, query: str):
        """
        Analyzes the query to decide on search strategy.
        """
        prompt = f"""
        You are an expert research assistant. Analyze the following user query:
        "{query}"
        
        Determine the best tool to answer this query:
        - "web": for general knowledge, current events, definitions, broad topics.
        - "arxiv": for specific scientific papers, technical deep dives, math/CS/physics research.
        - "both": if it requires both general context and specific papers.
        - "none": if it's a simple greeting or doesn't need external info.
        
        Also provide 1-3 specific search queries optimized for that tool.
        
        Respond in this format strictly:
        Tool: [web/arxiv/both/none]
        Queries: [query1, query2, query3]
        """
        
        response = self.client.chat.completions.create(
            model=self.planning_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )
        
        content = response.choices[0].message.content
        
        tool = "none"
        queries = []
        
        for line in content.split('\n'):
            if line.strip().startswith("Tool:"):
                tool = line.split(":", 1)[1].strip().lower()
            elif line.strip().startswith("Queries:"):
                # Handle potential formatting variations like "Queries: [q1, q2]" or "Queries: q1, q2"
                q_str = line.split(":", 1)[1].strip()
                if q_str.startswith('[') and q_str.endswith(']'):
                    q_str = q_str[1:-1]
                queries = [q.strip() for q in q_str.split(',') if q.strip()]
                
        return tool, queries

    def research(self, user_query: str):
        """
        Main entry point for the agent.
        """
        yield {"type": "status", "message": "Analyzing your query..."}
        
        try:
            tool, queries = self._determine_search_needs(user_query)
            yield {"type": "plan", "tool": tool, "queries": queries}
        except Exception as e:
            yield {"type": "status", "message": f"Planning failed: {e}. Defaulting to web search."}
            tool = "web"
            queries = [user_query]
        
        context = ""
        
        if tool in ["web", "both"]:
            for q in queries:
                yield {"type": "status", "message": f"Searching web for: {q}..."}
                results = search_web(q)
                context += f"\n--- Web Search Results for '{q}' ---\n{results}\n"
                
        if tool in ["arxiv", "both"]:
            for q in queries:
                yield {"type": "status", "message": f"Searching Arxiv for: {q}..."}
                results = search_arxiv(q)
                context += f"\n--- Arxiv Search Results for '{q}' ---\n{results}\n"
        
        # If no tools were used but context is needed (e.g. tool=none but it's a question), 
        # we still proceed to synthesis mostly to chat.
        
        yield {"type": "status", "message": "Synthesizing answer..."}
        
        system_prompt = """
        You are an expert tutor and research agent. 
        Your goal is to provide a comprehensive, educational answer to the user's query based on the provided context.
        
        Guidelines:
        1. **Educational Tone**: Be patient, clear, and informative. Explain complex terms.
        2. **Structure**: Use Markdown. Include a clear introduction, main body with headings, and a conclusion.
        3. **Citations**: STRICTLY cite your sources. Use [Title](URL) format inline or at the bottom.
        4. **Synthesis**: Don't just list results; synthesize them into a coherent narrative.
        5. **No Context**: If you found no relevant info, admit it and answer to the best of your foundational knowledge, but note the lack of sources.
        """
        
        final_prompt = f"""
        User Query: {user_query}
        
        Research Context:
        {context}
        
        Please provide your educational response now.
        """
        
        stream = self.client.chat.completions.create(
            model=self.synthesis_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": final_prompt}
            ],
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield {"type": "response_chunk", "content": chunk.choices[0].delta.content}
