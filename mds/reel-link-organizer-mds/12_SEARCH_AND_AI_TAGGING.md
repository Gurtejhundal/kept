# Search and Automatic Categorization

## Search priorities
The user primarily remembers:
1. Reel visual
2. Approximate date
3. A word or product type

The search system must therefore prioritize date and text before advanced AI features.

## MVP search
- Title
- Notes
- Creator name and handle
- Category
- Domain
- Original source message
- Extracted metadata
- Date range
- Saved month
- Received month

## Search ranking
Recommended weighted ranking:
- Exact title match
- Creator match
- Category match
- Notes match
- Metadata description match
- Fuzzy term similarity
- Recency as a light tie-breaker

## Date search
Support:
- Exact date
- Date range
- Month and year
- “This week”
- “Last month”
- Calendar browsing

Natural-language dates can be added later.

## Automatic categorization
Initial rule-based and model-assisted categories:
- Fashion
- Beauty
- Study
- Courses
- Career
- Technology
- Food
- Travel
- Fitness
- Home
- Entertainment
- Other

Input signals:
- Destination domain
- Page title
- Page description
- Reel caption if available
- Shared message text
- OCR text from screenshot
- User correction history

## Confidence rules
- High confidence: preselect category
- Medium confidence: show as suggestion
- Low confidence: leave uncategorized

Never silently assign sensitive or potentially embarrassing categories.

## Duplicate detection
Compare:
- Normalized destination URL
- Original reel URL
- Content fingerprint
- Same user and close save time

When a duplicate is detected:
- Offer to open existing item
- Allow saving another copy when context differs

## Future semantic search
Example:
“Show the black dress reel I saved around exams.”

This requires:
- Embedding index
- Visual/OCR metadata
- Date interpretation
- User-specific retrieval
- Strong privacy controls
