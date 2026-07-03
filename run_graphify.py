import os
import sys
import json
import subprocess
from pathlib import Path

def run_pipeline():
    print("=== Graphify Local Pipeline ===")
    
    # 1. Ensure graphifyy is installed
    try:
        import graphify
        print("✓ graphifyy is already installed.")
    except ImportError:
        print("Installing graphifyy...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "graphifyy"])
            import graphify
            print("✓ graphifyy installed successfully.")
        except Exception as e:
            print(f"Failed to install graphifyy: {e}")
            print("Please run: pip install graphifyy")
            sys.exit(1)

    # Resolve imports
    from graphify.detect import detect, save_manifest
    from graphify.extract import collect_files, extract
    from graphify.build import build_from_json
    from graphify.cluster import cluster, score_all
    from graphify.analyze import god_nodes, surprising_connections, suggest_questions
    from graphify.report import generate
    from graphify.export import to_json
    from graphify.cache import check_semantic_cache, save_semantic_cache

    # Ensure output dir
    output_dir = Path('graphify-out')
    output_dir.mkdir(exist_ok=True)

    # Save python path
    with open(output_dir / '.graphify_python', 'w', encoding='utf-8') as f:
        f.write(sys.executable)
    with open(output_dir / '.graphify_root', 'w', encoding='utf-8') as f:
        f.write(str(Path('.').resolve()))

    # Step 2: Detect files
    print("\n[Step 2] Detecting files...")
    detection = detect(Path('.'))
    with open(output_dir / '.graphify_detect.json', 'w', encoding='utf-8') as f:
        json.dump(detection, f, ensure_ascii=False, indent=2)
    
    # Print summary
    files_info = detection.get('files', {})
    print(f"Corpus: {detection.get('total_files', 0)} files · ~{detection.get('total_words', 0)} words")
    for category, files in files_info.items():
        if files:
            print(f"  {category}: {len(files)} files")

    if detection.get('total_files', 0) == 0:
        print("No supported files found. Exiting.")
        sys.exit(0)

    # Step 3: Extract entities and relationships
    print("\n[Step 3] Extracting entities and relationships...")
    
    # Part A: AST Extraction
    print("Running AST extraction on code files...")
    code_files = []
    for f in files_info.get('code', []):
        code_path = Path(f)
        if code_path.is_dir():
            code_files.extend(collect_files(code_path))
        else:
            code_files.append(code_path)

    ast_result = {'nodes': [], 'edges': [], 'input_tokens': 0, 'output_tokens': 0}
    if code_files:
        try:
            ast_result = extract(code_files, cache_root=Path('.'))
            print(f"✓ AST: {len(ast_result['nodes'])} nodes, {len(ast_result['edges'])} edges extracted.")
        except Exception as e:
            print(f"Warning during AST extraction: {e}")
    else:
        print("No code files found for AST extraction.")

    with open(output_dir / '.graphify_ast.json', 'w', encoding='utf-8') as f:
        json.dump(ast_result, f, ensure_ascii=False, indent=2)

    # Part B: Semantic Extraction (LLM-based)
    api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    semantic_result = {'nodes': [], 'edges': [], 'hyperedges': [], 'input_tokens': 0, 'output_tokens': 0}
    
    non_code_files = files_info.get('docs', []) + files_info.get('papers', []) + files_info.get('images', [])
    
    if non_code_files:
        if api_key:
            print("Running parallel semantic extraction using Gemini API...")
            try:
                from graphify.llm import extract_corpus_parallel
                # Set model if specified in env
                model = os.environ.get('GRAPHIFY_GEMINI_MODEL', 'gemini-1.5-flash')
                os.environ['GEMINI_API_KEY'] = api_key # Ensure it's populated
                
                # Check cache first
                all_files = [f for cat in files_info.values() for f in cat]
                cached_nodes, cached_edges, cached_hyperedges, uncached = check_semantic_cache(all_files)
                print(f"Cache: {len(all_files)-len(uncached)} files hit, {len(uncached)} files need extraction")
                
                if uncached:
                    new_semantic = extract_corpus_parallel(uncached, backend="gemini", model=model)
                    save_semantic_cache(new_semantic.get('nodes', []), new_semantic.get('edges', []), new_semantic.get('hyperedges', []))
                    
                    semantic_result['nodes'] = cached_nodes + new_semantic.get('nodes', [])
                    semantic_result['edges'] = cached_edges + new_semantic.get('edges', [])
                    semantic_result['hyperedges'] = cached_hyperedges + new_semantic.get('hyperedges', [])
                    semantic_result['input_tokens'] = new_semantic.get('input_tokens', 0)
                    semantic_result['output_tokens'] = new_semantic.get('output_tokens', 0)
                else:
                    semantic_result['nodes'] = cached_nodes
                    semantic_result['edges'] = cached_edges
                    semantic_result['hyperedges'] = cached_hyperedges
                
                print(f"✓ Semantic: {len(semantic_result['nodes'])} nodes, {len(semantic_result['edges'])} edges extracted.")
            except Exception as e:
                print(f"Warning during semantic extraction: {e}")
                print("Proceeding with empty semantic results.")
        else:
            print("\nTip: Set GEMINI_API_KEY or GOOGLE_API_KEY to use Gemini for semantic extraction of documents/markdown files.")
            print("Proceeding with structural (AST-only) extraction.")

    with open(output_dir / '.graphify_semantic.json', 'w', encoding='utf-8') as f:
        json.dump(semantic_result, f, ensure_ascii=False, indent=2)

    # Part C: Merge AST + Semantic
    print("Merging AST and semantic extraction results...")
    seen = {n['id'] for n in ast_result['nodes']}
    merged_nodes = list(ast_result['nodes'])
    for n in semantic_result['nodes']:
        if n['id'] not in seen:
            merged_nodes.append(n)
            seen.add(n['id'])

    merged_edges = ast_result['edges'] + semantic_result['edges']
    merged_hyperedges = semantic_result.get('hyperedges', [])
    
    merged = {
        'nodes': merged_nodes,
        'edges': merged_edges,
        'hyperedges': merged_hyperedges,
        'input_tokens': semantic_result.get('input_tokens', 0),
        'output_tokens': semantic_result.get('output_tokens', 0),
    }
    with open(output_dir / '.graphify_extract.json', 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print(f"✓ Merged: {len(merged_nodes)} nodes, {len(merged_edges)} edges ({len(ast_result['nodes'])} AST + {len(semantic_result['nodes'])} semantic)")

    # Step 4: Build graph, cluster, analyze
    print("\n[Step 4] Building graph and analyzing...")
    G = build_from_json(merged)
    
    if G.number_of_nodes() == 0:
        print("ERROR: Graph is empty - extraction produced no nodes.")
        sys.exit(1)

    communities = cluster(G)
    cohesion = score_all(G, communities)
    tokens = {'input': merged.get('input_tokens', 0), 'output': merged.get('output_tokens', 0)}
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)
    
    # Generate labels programmatically using top-degree nodes in each community
    labels = {}
    for cid, nodes in communities.items():
        nodes_sorted = sorted(nodes, key=lambda n: G.degree(n), reverse=True)
        top_labels = []
        for n in nodes_sorted[:3]:
            label = G.nodes[n].get('label', n)
            if '/' in label or '\\' in label:
                label = Path(label).name
            top_labels.append(label)
        labels[cid] = " / ".join(top_labels)

    questions = suggest_questions(G, communities, labels)
    
    # Generate report
    report = generate(G, communities, cohesion, labels, gods, surprises, detection, tokens, '.', suggested_questions=questions)
    with open(output_dir / 'GRAPH_REPORT.md', 'w', encoding='utf-8') as f:
        f.write(report)
        
    to_json(G, communities, str(output_dir / 'graph.json'))
    
    # Save community labels
    with open(output_dir / '.graphify_labels.json', 'w', encoding='utf-8') as f:
        json.dump({str(k): v for k, v in labels.items()}, f, ensure_ascii=False, indent=2)

    print(f"✓ Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities")

    # Step 6: Export HTML
    print("\n[Step 6] Exporting interactive HTML visualization...")
    try:
        subprocess.run([sys.executable, "-m", "graphify.export", "html"], check=True)
        print("✓ graph.html generated successfully.")
    except Exception as e:
        print(f"Warning: HTML export failed: {e}")

    # Step 8: Token reduction benchmark
    if detection.get('total_words', 0) > 5000:
        print("\n[Step 8] Running token reduction benchmark...")
        try:
            subprocess.run([sys.executable, "-m", "graphify.benchmark"], check=True)
        except Exception as e:
            print(f"Warning: Benchmark failed: {e}")

    # Step 9: Save manifest and clean up temp files
    print("\n[Step 9] Saving manifest and cleaning up...")
    save_manifest(detection.get('all_files') or detection['files'])
    
    temp_files = [
        '.graphify_detect.json',
        '.graphify_extract.json',
        '.graphify_ast.json',
        '.graphify_semantic.json',
        '.graphify_labels.json'
    ]
    for tf in temp_files:
        p = output_dir / tf
        if p.exists():
            p.unlink()

    print("\n=== Pipeline Complete! ===")
    print("Outputs generated in graphify-out/:")
    print("  graph.html            - interactive graph, open in browser")
    print("  GRAPH_REPORT.md       - audit report")
    print("  graph.json            - raw graph data")

if __name__ == '__main__':
    run_pipeline()
