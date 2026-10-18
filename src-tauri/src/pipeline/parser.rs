/// Response parser: brand mention detection, competitor detection, sentiment analysis, citation extraction.

/// Context about the brand for parsing
pub struct BrandContext {
    pub brand_name: String,
    pub aliases: Vec<String>,
    pub competitors: Vec<String>,
    pub site_domain: String,
}

/// Parsed output from analyzing a single AI response
pub struct ParseOutput {
    pub brand_mentioned: bool,
    pub mention_position: Option<i64>,
    pub total_entities_mentioned: i64,
    pub sentiment_level: String,
    pub sentiment_score: f64,
    pub brand_context_snippet: String,
    pub competitors_found: Vec<String>,
    pub extracted_urls: Vec<String>,
}

/// Parse an AI engine response text to extract brand mentions, sentiment, competitors, and URLs.
pub fn parse_response(text: &str, brand: &BrandContext) -> ParseOutput {
    let text_lower = text.to_lowercase();

    // --- Brand mention detection ---
    let brand_lower = brand.brand_name.to_lowercase();
    let all_names: Vec<String> = std::iter::once(brand_lower.clone())
        .chain(brand.aliases.iter().map(|a| a.to_lowercase()))
        .collect();

    let brand_mentioned = all_names.iter().any(|name| text_lower.contains(name.as_str()));

    // --- Mention position (which paragraph/sentence) ---
    let mention_position = if brand_mentioned {
        let paragraphs: Vec<&str> = text.split('\n')
            .filter(|p| !p.trim().is_empty())
            .collect();
        paragraphs.iter().position(|p| {
            let p_lower = p.to_lowercase();
            all_names.iter().any(|name| p_lower.contains(name.as_str()))
        }).map(|pos| (pos + 1) as i64)
    } else {
        None
    };

    // --- Competitor detection ---
    let competitors_found: Vec<String> = brand.competitors.iter()
        .filter(|comp| text_lower.contains(&comp.to_lowercase()))
        .cloned()
        .collect();

    // --- Total entities mentioned (brand + competitors) ---
    let total_entities = if brand_mentioned { 1 } else { 0 } + competitors_found.len() as i64;

    // --- Sentiment analysis (keyword-based) ---
    let (sentiment_level, sentiment_score) = analyze_sentiment(&text_lower, &all_names);

    // --- Brand context snippet (extract surrounding text) ---
    let brand_context_snippet = extract_brand_snippet(text, &all_names);

    // --- URL extraction ---
    let extracted_urls = extract_urls(text);

    ParseOutput {
        brand_mentioned,
        mention_position,
        total_entities_mentioned: total_entities,
        sentiment_level,
        sentiment_score,
        brand_context_snippet,
        competitors_found,
        extracted_urls,
    }
}

fn analyze_sentiment(text_lower: &str, brand_names: &[String]) -> (String, f64) {
    // Find sentences mentioning the brand
    let sentences: Vec<&str> = text_lower.split(|c: char| c == '.' || c == '!' || c == '?')
        .filter(|s| !s.trim().is_empty())
        .collect();

    let brand_sentences: Vec<&&str> = sentences.iter()
        .filter(|s| brand_names.iter().any(|name| s.contains(name.as_str())))
        .collect();

    if brand_sentences.is_empty() {
        return ("neutral".to_string(), 0.0);
    }

    let positive_words = [
        "best", "leading", "excellent", "top", "recommend", "popular", "trusted",
        "reliable", "innovative", "powerful", "outstanding", "great", "superior",
        "preferred", "award", "highly rated", "well-known", "renowned", "strong",
        "effective", "efficient", "comprehensive", "robust", "advanced",
    ];
    let negative_words = [
        "worst", "poor", "bad", "avoid", "unreliable", "expensive", "slow",
        "difficult", "lacking", "limited", "outdated", "weak", "inferior",
        "complaint", "issue", "problem", "concern", "disappointing", "mediocre",
    ];

    let mut pos_count = 0i32;
    let mut neg_count = 0i32;

    for sentence in &brand_sentences {
        for word in &positive_words {
            if sentence.contains(word) {
                pos_count += 1;
            }
        }
        for word in &negative_words {
            if sentence.contains(word) {
                neg_count += 1;
            }
        }
    }

    let total = pos_count + neg_count;
    if total == 0 {
        return ("neutral".to_string(), 0.0);
    }

    let score = (pos_count as f64 - neg_count as f64) / total as f64;

    let level = if score > 0.2 {
        "positive"
    } else if score < -0.2 {
        "negative"
    } else {
        "neutral"
    };

    (level.to_string(), score)
}

fn extract_brand_snippet(text: &str, brand_names: &[String]) -> String {
    let text_lower = text.to_lowercase();

    for name in brand_names {
        if let Some(pos) = text_lower.find(name.as_str()) {
            let start = pos.saturating_sub(100);
            let end = (pos + name.len() + 100).min(text.len());
            // Find word boundaries
            let snippet_start = if start > 0 {
                text[start..].find(' ').map(|i| start + i + 1).unwrap_or(start)
            } else {
                0
            };
            let snippet_end = if end < text.len() {
                text[..end].rfind(' ').unwrap_or(end)
            } else {
                text.len()
            };
            return text[snippet_start..snippet_end].to_string();
        }
    }

    // No mention found, return first 200 chars
    text.chars().take(200).collect()
}

fn extract_urls(text: &str) -> Vec<String> {
    let mut urls = Vec::new();
    for word in text.split_whitespace() {
        let trimmed = word.trim_matches(|c: char| c == '(' || c == ')' || c == '[' || c == ']' || c == '<' || c == '>' || c == ',');
        if (trimmed.starts_with("http://") || trimmed.starts_with("https://")) && trimmed.len() > 10 {
            urls.push(trimmed.to_string());
        }
    }
    urls
}

/// Classify a citation URL source type based on the brand's domain
pub fn classify_citation(url: &str, brand_domain: &str, competitor_domains: &[String]) -> (&'static str, bool) {
    let domain = extract_domain(url);
    let domain_lower = domain.to_lowercase();
    let brand_domain_lower = brand_domain.to_lowercase();

    // Check if it's the brand's own domain
    if domain_lower.contains(&brand_domain_lower) || brand_domain_lower.contains(&domain_lower) {
        return ("owned", false);
    }

    // Check if it's a competitor domain
    for comp_domain in competitor_domains {
        if domain_lower.contains(&comp_domain.to_lowercase()) {
            return ("competitor", false);
        }
    }

    // Check if it's an authoritative source
    let authority_domains = [
        "wikipedia.org", "forbes.com", "techcrunch.com", "reuters.com",
        "bloomberg.com", "nytimes.com", "wsj.com", "bbc.com", "cnn.com",
        "theguardian.com", "wired.com", "arstechnica.com", "theverge.com",
        "g2.com", "capterra.com", "trustpilot.com", "gartner.com",
        "reddit.com", "stackoverflow.com", "github.com",
        "medium.com", "linkedin.com",
    ];

    for auth in &authority_domains {
        if domain_lower.contains(auth) {
            return ("authority", true);
        }
    }

    ("third_party", false)
}

fn extract_domain(url: &str) -> String {
    url.trim_start_matches("https://")
        .trim_start_matches("http://")
        .split('/')
        .next()
        .unwrap_or("")
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_brand() -> BrandContext {
        BrandContext {
            brand_name: "Acme Corp".to_string(),
            aliases: vec!["Acme".to_string()],
            competitors: vec!["Rival Inc".to_string(), "BigCo".to_string()],
            site_domain: "acme.com".to_string(),
        }
    }

    // --- parse_response tests ---

    #[test]
    fn detects_brand_mention() {
        let brand = make_brand();
        let result = parse_response("I recommend Acme Corp for this use case.", &brand);
        assert!(result.brand_mentioned);
        assert_eq!(result.mention_position, Some(1));
    }

    #[test]
    fn detects_alias_mention() {
        let brand = make_brand();
        let result = parse_response("You should try Acme, it's great.", &brand);
        assert!(result.brand_mentioned);
    }

    #[test]
    fn no_mention() {
        let brand = make_brand();
        let result = parse_response("There are many tools available for this task.", &brand);
        assert!(!result.brand_mentioned);
        assert_eq!(result.mention_position, None);
    }

    #[test]
    fn detects_competitors() {
        let brand = make_brand();
        let result = parse_response("Rival Inc and BigCo are popular choices.", &brand);
        assert!(!result.brand_mentioned);
        assert_eq!(result.competitors_found.len(), 2);
        assert!(result.competitors_found.contains(&"Rival Inc".to_string()));
        assert!(result.competitors_found.contains(&"BigCo".to_string()));
    }

    #[test]
    fn total_entities_count() {
        let brand = make_brand();
        let result = parse_response("Acme Corp competes with Rival Inc in this space.", &brand);
        assert_eq!(result.total_entities_mentioned, 2); // brand + 1 competitor
    }

    #[test]
    fn mention_position_multi_paragraph() {
        let brand = make_brand();
        let text = "First paragraph about tools.\n\nSecond paragraph discusses options.\n\nAcme Corp is mentioned here.";
        let result = parse_response(text, &brand);
        assert!(result.brand_mentioned);
        assert_eq!(result.mention_position, Some(3));
    }

    #[test]
    fn extracts_urls() {
        let brand = make_brand();
        let text = "Visit https://example.com/page and http://test.org/path for more info about Acme.";
        let result = parse_response(text, &brand);
        assert_eq!(result.extracted_urls.len(), 2);
        assert!(result.extracted_urls.contains(&"https://example.com/page".to_string()));
    }

    // --- sentiment tests ---

    #[test]
    fn positive_sentiment() {
        let brand = make_brand();
        let result = parse_response("Acme Corp is the best and most reliable solution.", &brand);
        assert_eq!(result.sentiment_level, "positive");
        assert!(result.sentiment_score > 0.0);
    }

    #[test]
    fn negative_sentiment() {
        let brand = make_brand();
        let result = parse_response("Acme Corp is slow, unreliable, and has many issues.", &brand);
        assert_eq!(result.sentiment_level, "negative");
        assert!(result.sentiment_score < 0.0);
    }

    #[test]
    fn neutral_sentiment_no_keywords() {
        let brand = make_brand();
        let result = parse_response("Acme Corp offers a product in this category.", &brand);
        assert_eq!(result.sentiment_level, "neutral");
    }

    // --- classify_citation tests ---

    #[test]
    fn classifies_owned_domain() {
        let (source_type, is_auth) = classify_citation("https://acme.com/about", "acme.com", &[]);
        assert_eq!(source_type, "owned");
        assert!(!is_auth);
    }

    #[test]
    fn classifies_competitor_domain() {
        let competitors = vec!["rivalinc".to_string()];
        let (source_type, is_auth) = classify_citation("https://rivalinc.com/product", "acme.com", &competitors);
        assert_eq!(source_type, "competitor");
        assert!(!is_auth);
    }

    #[test]
    fn classifies_authority_domain() {
        let (source_type, is_auth) = classify_citation("https://en.wikipedia.org/wiki/Acme", "acme.com", &[]);
        assert_eq!(source_type, "authority");
        assert!(is_auth);
    }

    #[test]
    fn classifies_third_party() {
        let (source_type, is_auth) = classify_citation("https://randomsite.io/review", "acme.com", &[]);
        assert_eq!(source_type, "third_party");
        assert!(!is_auth);
    }

    #[test]
    fn classifies_forbes_as_authority() {
        let (source_type, is_auth) = classify_citation("https://www.forbes.com/article", "acme.com", &[]);
        assert_eq!(source_type, "authority");
        assert!(is_auth);
    }
}
