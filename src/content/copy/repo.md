---
section: repo
eyebrow: "In your repo"
title: "Your process, as plain config."
body: "Roles, who holds them, and where each decision goes, in YAML you can read in a diff and edit by hand."
caption: "Illustrative: the syntax isn’t final."
snippet: |
  # .troupe/theatre.yaml (illustrative)
  roles:
    product-owner: { held-by: you }
    engineer:      { held-by: agent/claude-code }
    reviewer:      { held-by: agent/claude-code }
  gates:
    release: { decided-by: product-owner }
---
