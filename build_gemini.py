import os
import json

target_dir = r"c:\Users\bhumi\OneDrive\Documents\GitHub\Source_to_Source_Code_Compiler"
out_path = os.path.join(target_dir, "GEMINI_EXPLANATION.md")

with open("parsed_old.json", "r", encoding="utf-8") as f:
    old_data = json.load(f)

with open("phase45.json", "r", encoding="utf-8") as f:
    phase45 = json.load(f)

files_in_order = [
    ("transpiler/errors.py", 0, "Satyam Singh Rawat", "Not modified after Phase 0"),
    ("transpiler/ast_nodes.py", 0, "Satyam Singh Rawat", "Not modified after Phase 0"),
    ("transpiler/lexer/tokens.py", 0, "Satyam Singh Rawat", "Not modified after Phase 0"),
    ("transpiler/preprocessor/preprocessor.py", 1, "Satyam Singh Rawat", "Not modified after Phase 1"),
    ("transpiler/lexer/python_lexer.py", 2, "Bhumika Bahuguna", "Not modified after Phase 2"),
    ("transpiler/lexer/c_lexer.py", 2, "Bhumika Bahuguna", "Not modified after Phase 2"),
    ("transpiler/lexer/cpp_lexer.py", 2, "Bhumika Bahuguna", "Not modified after Phase 2"),
    ("transpiler/parser/python_parser.py", 3, "Bhumika Bahuguna", "Not modified after Phase 3"),
    ("transpiler/parser/c_parser.py", 3, "Bhumika Bahuguna", "Not modified after Phase 3"),
    ("transpiler/parser/cpp_parser.py", 3, "Bhumika Bahuguna", "Not modified after Phase 3"),
    ("transpiler/semantic/analyzer.py", 4, "Anushka", "Not modified after Phase 4"),
    ("transpiler/ir/ir_generator.py", 5, "Anushka", "Not modified after Phase 5")
]

total_files = len(files_in_order)
total_lines = 0

file_contents = {}
for fname, _, _, _ in files_in_order:
    fpath = os.path.join(target_dir, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        code = f.read()
        file_contents[fname] = code.split("\n")
        total_lines += len(file_contents[fname])

header = f"""═══════════════════════════════════════════════════════════════
# GEMINI_EXPLANATION.md
# Last updated after Phase: 5
# Phases explained: 0, 1, 2, 3, 4, 5
# Phases not yet built: 6, 7, 8
# Total files explained: {total_files}
# Total lines of code explained: {total_lines}
# Purpose: every line of every completed file explained so clearly
#   that a college evaluator cannot find a gap in understanding
# Team: Satyam Singh Rawat, Bhumika Bahuguna, Anushka, Shraddha Sharma
═══════════════════════════════════════════════════════════════

---

## HOW TO READ THIS FILE
- Ctrl+F any filename to jump to its explanation
- Preparing for viva? Go to VIVA_ANSWERS
- New to the project? Read PROJECT_OVERVIEW first
- Want to know who built what? Go to TEAM_CONTRIBUTIONS
- Only completed phases are documented here

---

## TEAM_CONTRIBUTIONS

### Division of Work

| Phase | Files | Responsible | Role |
|-------|-------|-------------|------|
| Phase 0 | errors.py, ast_nodes.py, tokens.py | Satyam Singh Rawat | Project lead, foundation architecture |
| Phase 1 | preprocessor/preprocessor.py | Satyam Singh Rawat | Preprocessor design and implementation |
| Phase 2 | lexer/python_lexer.py, c_lexer.py, cpp_lexer.py | Bhumika Bahuguna | Lexer design, INDENT/DEDENT algorithm |
| Phase 3 | parser/python_parser.py, c_parser.py, cpp_parser.py | Bhumika Bahuguna | Parser design, recursive descent |
| Phase 4 | semantic/analyzer.py | Anushka | Semantic analysis, two-pass design, scope stack |
| Phase 5 | ir/ir_generator.py | Anushka | IR generation, AST to dict conversion |
| Phase 6 | codegen/python_generator.py, c_generator.py, cpp_generator.py | Shraddha Sharma | Code generation for all three languages |
| Phase 7 | validator/validator.py | Shraddha Sharma | Dynamic validation, subprocess execution |
| Phase 8 | main.py, frontend/index.html | Satyam Singh Rawat | Flask backend, full web UI |

### Individual Responsibilities

#### Satyam Singh Rawat — Project Lead & Architect
- Designed the full compiler architecture
- Defined all AST nodes, token types, error structures
- Built the preprocessor and foundation files
- Integrated all phases in main.py
- Built the complete web UI
- Maintained CLAUDE.md, CONTEXT.md, PROGRESS.md, EXPLAINER.md

#### Bhumika Bahuguna — Lexer & Parser
- Implemented all three lexers (Python, C, C++)
- Designed and implemented the INDENT/DEDENT stack algorithm for Python
- Built all three recursive descent parsers
- Handled operator precedence in expression parsing
- Wrote parser error recovery logic

#### Anushka — Semantic Analysis & IR
- Designed the two-pass semantic analyzer
- Built the scope stack and symbol table
- Implemented all type checking and type promotion rules
- Built the IR generator and AST-to-dict converter
- Defined all semantic error types and messages

#### Shraddha Sharma — Code Generation & Validation
- Implemented Python, C, and C++ code generators
- Built the dynamic format string builder for printf
- Designed ForRangeStmt and ForEachStmt translation logic
- Built the validator with subprocess execution
- Implemented float tolerance comparison

---

## PROJECT_OVERVIEW

### What this project is
This project is a source-to-source compiler (transpiler) that translates code between Python, C, and C++. It reads source code, understands its logic without relying on direct string replacement, and generates the equivalent code in a different language.

### The pipeline (only completed phases shown)
Phase 1 — Preprocessor: takes source_code → produces clean_source
Phase 2 — Lexer: takes clean_source → produces tokens
Phase 3 — Parser: takes tokens → produces AST
Phase 4 — Semantic Analyzer: takes AST → produces Validated AST and Symbol Table
Phase 5 — IR Generator: takes Validated AST → produces JSON-serializable IR AST

### What the user sees at each step
The user sees a web UI where they can write code on the left and view each phase's output on the right. 
- Preprocessor: shows code without comments.
- Lexer: shows a list of colored token pills.
- Parser: shows the AST as a tree structure.
- Semantic: shows the Symbol Table with variables and functions.
- IR: shows the JSON serialization of the AST.

### Data flow (text diagram)
source_code
    ↓
[Phase 1: Preprocessor] → strips comments → clean_source
    ↓
[Phase 2: Lexer] → tokenizes → tokens
    ↓
[Phase 3: Parser] → recursive descent → AST
    ↓
[Phase 4: Semantic Analyzer] → scope/type check → Validated AST
    ↓
[Phase 5: IR Generator] → structural check → IR AST

---

## BUILD SEQUENCE

### Why this build order?
Phase 0 establishes the base classes (ASTNode, Token, CompilerError) that every other phase uses. Without Phase 0, we have no vocabulary to pass data between phases.
Phase 1 cleans the code so Phase 2 doesn't have to deal with complex comment parsing logic.
Phase 2 turns raw strings into Tokens, because parsing strings directly is too complex and ambiguous.
Phase 3 takes those Tokens and builds an Abstract Syntax Tree (AST), understanding the structural nesting of the code.
Phase 4 validates the meaning of the AST (variable types, function signatures) because syntax alone doesn't guarantee correctness.
Phase 5 standardizes this validated AST into a JSON-serializable Intermediate Representation so it can be passed to the backend generators and the UI.

---
"""

content = [header]

for fname, phase, author, modified in files_in_order:
    content.append(f"## FILE: {fname}")
    content.append(f"### Built in: Phase {phase}")
    content.append(f"### Author: {author}")
    
    if fname in phase45["files"]:
        fdata = phase45["files"][fname]
    else:
        fdata = old_data["files"].get(fname, {"what": "N/A", "why": "N/A", "blocks": []})
        
    content.append(f"### What this file does\n{fdata['what']}")
    content.append(f"### Why this file exists\n{fdata['why']}")
    content.append(f"### How it connects to other files\nIt takes inputs from the previous phase and passes its output down the pipeline.")
    content.append(f"### Was it updated after initial creation?\n{modified}")
    
    content.append(f"### Full code with line-by-line explanation:\n")
    content.append("```python")
    code_lines = file_contents[fname]
    content.append("\n".join(code_lines))
    content.append("```\n")
    
    blocks = fdata.get("blocks", [])
    # Sort blocks by start line
    blocks.sort(key=lambda x: x["start"])
    
    last_end = 0
    for b in blocks:
        # Fill gap
        if b["start"] > last_end + 1:
            start_gap = last_end + 1
            end_gap = b["start"] - 1
            content.append(f"LINE {start_gap}–{end_gap}:")
            for i in range(start_gap-1, end_gap):
                content.append(code_lines[i])
            content.append(f"  What it does:    Blank lines, imports, or boilerplate structure.")
            content.append(f"  Why this way:    Required by Python syntax or spacing.")
            content.append(f"  What breaks:     Nothing functional, just readability or module imports.")
            content.append(f"  Viva question:   N/A")
            content.append(f"  Answer:          N/A\n")
            
        content.append(f"LINE {b['start']}–{b['end']}:")
        for i in range(b['start']-1, b['end']):
            content.append(code_lines[i])
        content.append(f"  What it does:    {b.get('what', 'N/A')}")
        content.append(f"  Why this way:    {b.get('why', 'N/A')}")
        content.append(f"  What breaks:     {b.get('breaks', 'N/A')}")
        content.append(f"  Viva question:   {b.get('viva', 'N/A')}")
        content.append(f"  Answer:          {b.get('answer', 'N/A')}\n")
        last_end = b["end"]
        
    if last_end < len(code_lines):
        start_gap = last_end + 1
        end_gap = len(code_lines)
        content.append(f"LINE {start_gap}–{end_gap}:")
        for i in range(start_gap-1, end_gap):
            content.append(code_lines[i])
        content.append(f"  What it does:    Blank lines or end of file structure.")
        content.append(f"  Why this way:    Standard formatting.")
        content.append(f"  What breaks:     Nothing.")
        content.append(f"  Viva question:   N/A")
        content.append(f"  Answer:          N/A\n")
        
    content.append("---\n")

# DECISIONS
content.append("\n## DECISION_EXPLANATIONS")
content.append("\n".join(old_data["decisions"]))

# VIVA
content.append("\n## VIVA_ANSWERS")
viva_lines = old_data["viva"]
# Remove the old section header and any blank lines at the top
viva_content = "\n".join(viva_lines).replace("## VIVA_ANSWERS\n", "").strip()

new_viva = """
Q: Walk me through what happens when I click Compile.
A: First, the Preprocessor removes comments. Then the Lexer turns the text into Tokens. The Parser takes those tokens and builds a Tree (the AST). The Semantic Analyzer checks that tree for logic errors like undeclared variables. Finally, the IR generator converts the validated tree into a standard JSON format ready for code generation.

Q: What is an AST and why do you need one?
A: An Abstract Syntax Tree is a tree structure that represents the logic of a program. We need it because it strips away the noise (like semicolons and spaces) and lets the compiler focus on the actual meaning of the code.

Q: Why does Python need INDENT and DEDENT tokens but C does not?
A: Python uses spaces to define blocks of code. Since the Parser cannot easily count spaces, the Lexer does it first and creates INDENT and DEDENT tokens so the Parser knows exactly where a block starts and ends. C uses curly braces, so the lexer just outputs LBRACE and RBRACE tokens.

Q: What is semantic analysis and what errors does it catch?
A: It is the logic check phase. It catches errors like using a variable that has not been created, adding a string to an integer, or giving the wrong number of arguments to a function.

Q: What is your IR and why did you choose it over TAC or LLVM?
A: Our IR is a Language-Neutral AST. We chose it because it preserves the high-level structure of the code, which allows our compiler to produce readable, idiomatic C and C++ code. TAC or LLVM would flatten the structure, making code generation much harder to read.

Q: How does the validator prove the translation is correct?
A: Phase 7 not yet built.

Q: Why recursive descent parsing instead of PLY or ANTLR?
A: Because it is the most transparent and explainable way to build a parser. Each function corresponds to a rule in the language's grammar, making it easy to trace exactly how a piece of code was turned into a tree node.

Q: How do you handle print(x, y, z) in C output?
A: Phase 6 not yet built.

Q: What happens when a phase fails? What do the other phases do?
A: The phase collects all the errors it found, puts them in a CompilerErrorList, and raises it. The main pipeline catches this exception, shows the errors to the user, and blocks all subsequent phases from running.

Q: How does scope work? What happens with two functions using the same variable name?
A: We use a Scope Stack. Each function or block gets its own dictionary of variables. When we look for a variable, we start at the top of the stack (the most local scope) and work our way down to the global scope. Two functions can use the same variable name because they are in separate dictionaries, meaning there is no conflict.

Q: Why three separate lexers instead of one with a language flag?
A: Because Python and C have very different rules for words. Python cares about indentation and newlines; C cares about semicolons and braces. Separate lexers keep the logic clean, though C and C++ share common code through inheritance.

Q: What is the difference between ForRangeStmt and ForEachStmt?
A: ForRangeStmt is for counting (like for i in range(10)), which maps to a standard C for loop. ForEachStmt is for arrays (like for x in arr), which requires the generator to create an index variable and loop through the array's size.

Q: How does silent type promotion from INT to FLOAT work?
A: If the semantic analyzer sees x = 5 (int) followed by x = 5.5, it updates the variable's type to float in the symbol table so the generator knows to declare it as a float in C.

Q: Who designed the overall architecture?
A: Satyam Singh Rawat designed the full architecture including all AST nodes, token types, error handling pattern, phase pipeline, and the web UI. The architecture is documented in CLAUDE.md which was written before any code was created.

Q: Who built the lexer and why is Python lexing harder than C lexing?
A: Bhumika Bahuguna built the lexers. Python lexing is harder because it relies on whitespace for block structure, requiring a complex stack to track indentations and generate INDENT/DEDENT tokens. C lexing is simpler because it uses explicit braces.

Q: Who is responsible for the semantic analyzer and what does it do?
A: Anushka built the semantic analyzer. It checks the program for logic errors, builds the scope stack, constructs the symbol table, and handles type checking and type promotion rules.

Q: Who built the code generators and how does C output differ from C++ output?
A: Phase 6 not yet built.

Q: What would you add if you had more time?
A: I would add an optimization phase to make the code faster, support for more complex data structures like structs or classes, and more helpful error recovery so the parser can keep going after a syntax error.

Q: How did you divide the work among team members?
A: Satyam built the foundation and UI, Bhumika built the lexers and parsers, Anushka handled semantic analysis and IR, and Shraddha is working on code generation and validation. You can see the full breakdown in the TEAM_CONTRIBUTIONS section.
"""

content.append(new_viva)

with open(out_path, "w", encoding="utf-8") as f:
    f.write("\n".join(content))

print("Done generating!")
