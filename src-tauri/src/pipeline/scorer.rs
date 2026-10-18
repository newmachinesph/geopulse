/// Visibility scoring model.
///
/// Scoring rules (from Blueprint Section 7):
/// - Top 3 mention: +3
/// - Mentioned (not top 3): +1
/// - Positive/neutral sentiment: +1
/// - Authoritative citation: +1
/// - Max score: 5 per prompt

pub struct ScoreInput {
    pub brand_mentioned: bool,
    pub mention_position: Option<i64>,
    pub sentiment_level: String,
    pub has_authoritative_citation: bool,
}

pub fn calculate_visibility_score(input: &ScoreInput) -> f64 {
    let mut score: f64 = 0.0;

    if input.brand_mentioned {
        match input.mention_position {
            Some(pos) if pos <= 3 => score += 3.0,
            _ => score += 1.0,
        }
    }

    // Sentiment bonus
    if input.brand_mentioned && (input.sentiment_level == "positive" || input.sentiment_level == "neutral") {
        score += 1.0;
    }

    // Authoritative citation bonus
    if input.has_authoritative_citation {
        score += 1.0;
    }

    // Cap at 5.0
    score.min(5.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn not_mentioned_no_citation() {
        let input = ScoreInput {
            brand_mentioned: false,
            mention_position: None,
            sentiment_level: "neutral".to_string(),
            has_authoritative_citation: false,
        };
        assert_eq!(calculate_visibility_score(&input), 0.0);
    }

    #[test]
    fn not_mentioned_with_citation() {
        let input = ScoreInput {
            brand_mentioned: false,
            mention_position: None,
            sentiment_level: "neutral".to_string(),
            has_authoritative_citation: true,
        };
        assert_eq!(calculate_visibility_score(&input), 1.0);
    }

    #[test]
    fn mentioned_outside_top3() {
        let input = ScoreInput {
            brand_mentioned: true,
            mention_position: Some(5),
            sentiment_level: "negative".to_string(),
            has_authoritative_citation: false,
        };
        assert_eq!(calculate_visibility_score(&input), 1.0);
    }

    #[test]
    fn mentioned_top3_positive_with_citation() {
        let input = ScoreInput {
            brand_mentioned: true,
            mention_position: Some(1),
            sentiment_level: "positive".to_string(),
            has_authoritative_citation: true,
        };
        assert_eq!(calculate_visibility_score(&input), 5.0);
    }

    #[test]
    fn mentioned_top3_neutral_no_citation() {
        let input = ScoreInput {
            brand_mentioned: true,
            mention_position: Some(2),
            sentiment_level: "neutral".to_string(),
            has_authoritative_citation: false,
        };
        assert_eq!(calculate_visibility_score(&input), 4.0);
    }

    #[test]
    fn mentioned_top3_negative_with_citation() {
        let input = ScoreInput {
            brand_mentioned: true,
            mention_position: Some(3),
            sentiment_level: "negative".to_string(),
            has_authoritative_citation: true,
        };
        // 3 (top3) + 0 (negative sentiment) + 1 (citation) = 4
        assert_eq!(calculate_visibility_score(&input), 4.0);
    }

    #[test]
    fn mentioned_no_position_positive() {
        let input = ScoreInput {
            brand_mentioned: true,
            mention_position: None,
            sentiment_level: "positive".to_string(),
            has_authoritative_citation: false,
        };
        // 1 (mentioned, no position = not top3) + 1 (positive) = 2
        assert_eq!(calculate_visibility_score(&input), 2.0);
    }
}
