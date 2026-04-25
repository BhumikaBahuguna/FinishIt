import os
import re

target_dir = r"c:\Users\bhumi\OneDrive\Documents\GitHub\Source_to_Source_Code_Compiler"
old_md_path = os.path.join(target_dir, "GEMINI_EXPLANATION.md")
progress_path = os.path.join(target_dir, "PROGRESS.md")
new_md_path = os.path.join(target_dir, "GEMINI_EXPLANATION.md")

with open(old_md_path, "r", encoding="utf-8") as f:
    old_md = f.read()

# Parse the old explanations
file_explanations = {}
current_file = None
lines = old_md.split("\n")
i = 0
while i < len(lines):
    line = lines[i]
    if line.startswith("## FILE: "):
        current_file = line.replace("## FILE: ", "").strip()
        file_explanations[current_file] = {"what": "", "why": "", "blocks": []}
        i += 1
        while i < len(lines) and not lines[i].startswith("### What this file does"):
            i += 1
        i += 1
        what_lines = []
        while i < len(lines) and not lines[i].startswith("### Why this file exists"):
            what_lines.append(lines[i])
            i += 1
        file_explanations[current_file]["what"] = "\n".join(what_lines).strip()
        
        i += 1
        why_lines = []
        while i < len(lines) and not lines[i].startswith("### Line by line:") and not lines[i].startswith("## FILE: ") and not lines[i].startswith("---"):
            why_lines.append(lines[i])
            i += 1
        file_explanations[current_file]["why"] = "\n".join(why_lines).strip()
        
        # Parse LINE blocks
        while i < len(lines) and not lines[i].startswith("## FILE: ") and not lines[i].startswith("---"):
            if lines[i].startswith("LINE "):
                m = re.match(r"LINE (\d+)-(\d+):\s*\[(.*?)\]", lines[i])
                if m:
                    start, end, desc = m.groups()
                    block = {"start": int(start), "end": int(end), "desc": desc, "what": "", "why": "", "breaks": "", "viva": "", "answer": ""}
                    i += 1
                    while i < len(lines) and not lines[i].startswith("LINE ") and not lines[i].startswith("## FILE: ") and not lines[i].startswith("---"):
                        curr = lines[i].strip()
                        if curr.startswith("What it does:"):
                            block["what"] = curr.replace("What it does:", "").strip()
                        elif curr.startswith("Why it is written this way:") or curr.startswith("Why this way:"):
                            block["why"] = curr.replace("Why it is written this way:", "").replace("Why this way:", "").strip()
                        elif curr.startswith("What breaks if you change it:") or curr.startswith("What breaks:"):
                            block["breaks"] = curr.replace("What breaks if you change it:", "").replace("What breaks:", "").strip()
                        elif curr.startswith("Viva question this could generate:") or curr.startswith("Viva question:"):
                            block["viva"] = curr.replace("Viva question this could generate:", "").replace("Viva question:", "").strip()
                        elif curr.startswith("Answer:"):
                            block["answer"] = curr.replace("Answer:", "").strip()
                        i += 1
                    file_explanations[current_file]["blocks"].append(block)
                    continue
            i += 1
    else:
        i += 1

# Read existing DECISIONS and VIVA
decisions = []
viva = []

in_dec = False
in_viva = False
for line in lines:
    if line.startswith("## DECISION_EXPLANATIONS"):
        in_dec = True
        in_viva = False
        continue
    if line.startswith("## VIVA_ANSWERS"):
        in_viva = True
        in_dec = False
        continue
    if in_dec and line.startswith("---"):
        in_dec = False
    if in_viva and line.startswith("---"):
        in_viva = False
        
    if in_dec: decisions.append(line)
    if in_viva: viva.append(line)

import json
with open("parsed_old.json", "w") as f:
    json.dump({"files": file_explanations, "decisions": decisions, "viva": viva}, f, indent=2)
