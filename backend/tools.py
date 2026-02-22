from duckduckgo_search import DDGS
import arxiv

def search_web(query: str, max_results: int = 5) -> str:
    """
    Performs a web search using DuckDuckGo.
    """
    print(f"Searching web for: {query}")
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            if not results:
                return "No web results found."
            
            formatted_results = "Web Search Results:\n\n"
            for i, r in enumerate(results, 1):
                formatted_results += f"{i}. [{r['title']}]({r['href']})\n   {r['body']}\n\n"
            return formatted_results
    except Exception as e:
        return f"Error performing web search: {str(e)}"

def search_arxiv(query: str, max_results: int = 3) -> str:
    """
    Searches Arxiv for academic papers.
    """
    print(f"Searching Arxiv for: {query}")
    try:
        search = arxiv.Search(
            query=query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.Relevance
        )
        
        results = []
        for result in search.results():
            results.append(result)
            
        if not results:
            return "No Arxiv papers found."

        formatted_results = "Arxiv Search Results:\n\n"
        for i, paper in enumerate(results, 1):
            formatted_results += f"{i}. [{paper.title}]({paper.entry_id})\n"
            formatted_results += f"   Authors: {', '.join(a.name for a in paper.authors)}\n"
            formatted_results += f"   Published: {paper.published.strftime('%Y-%m-%d')}\n"
            formatted_results += f"   Summary: {paper.summary.replace('\n', ' ')}\n\n"
            
        return formatted_results
    except Exception as e:
        return f"Error performing Arxiv search: {str(e)}"

if __name__ == "__main__":
    # Test the tools
    print(search_web("latest advancements in quantum computing"))
    print("-" * 50)
    print(search_arxiv("attention is all you need"))
