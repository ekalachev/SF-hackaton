#!/bin/bash
source ~/.zshrc
# Web Enrichment Agent using Puppeteer MCP

echo "🌐 Web Enrichment Agent"
echo "======================="

# Function to scrape company website
scrape_company_website() {
    local url="$1"
    local company_name="$2"
    
    echo "Scraping $url for $company_name..."
    
    # Use Puppeteer to get company information
    ~/claude-eng --mcp puppeteer --print "
    Navigate to $url and extract:
    1. Company description
    2. Industry/sector
    3. Key products/services
    4. Contact information
    5. Team size indicators
    Return as JSON
    "
}

# Function to get LinkedIn company info
get_linkedin_info() {
    local company="$1"
    
    echo "Searching LinkedIn for $company..."
    
    ~/claude-eng --mcp puppeteer --print "
    Search LinkedIn for company '$company' and extract:
    - Company size
    - Industry
    - Headquarters location
    - Company description
    Return as JSON without navigating (just search results)
    "
}

# Function to take screenshot of lead's website
capture_website_screenshot() {
    local url="$1"
    local filename="$2"
    
    echo "Capturing screenshot of $url..."
    
    ~/claude-eng --mcp puppeteer --print "
    Navigate to $url
    Take a full page screenshot
    Save as screenshots/$filename.png
    "
}

# Function to analyze competitor websites
analyze_competitors() {
    local industry="$1"
    
    echo "Analyzing competitors in $industry..."
    
    ~/claude-eng --mcp puppeteer --print "
    Search Google for 'top companies in $industry'
    Extract top 3 competitor names and websites
    Return as JSON list
    "
}

# Main enrichment function
enrich_lead_from_web() {
    local email="$1"
    local company="$2"
    
    echo "Starting web enrichment for $email at $company"
    
    # Extract domain from email
    local domain=$(echo "$email" | cut -d'@' -f2)
    local website="https://$domain"
    
    # Try to scrape the company website
    if curl -s --head "$website" | head -n 1 | grep "200\|301\|302" > /dev/null; then
        echo "✅ Website found: $website"
        scrape_company_website "$website" "$company"
        capture_website_screenshot "$website" "${company// /_}_screenshot"
    else
        echo "⚠️ No website found at $website"
        get_linkedin_info "$company"
    fi
    
    # Get industry competitors
    if [ -n "$company" ]; then
        analyze_competitors "$company industry"
    fi
    
    echo "✅ Web enrichment complete"
}

# Example usage
if [ "$1" == "test" ]; then
    echo "Running test enrichment..."
    enrich_lead_from_web "john@acme.com" "Acme Corp"
elif [ -n "$1" ] && [ -n "$2" ]; then
    enrich_lead_from_web "$1" "$2"
else
    echo "Usage: $0 <email> <company>"
    echo "   or: $0 test"
fi