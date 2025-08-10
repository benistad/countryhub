#!/bin/bash

# Test script for debugging the sync-official-videos Edge Function
# Usage: ./test-edge-function.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== CountryMusic-Hub Edge Function Test ===${NC}"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}Error: .env.local file not found${NC}"
    echo "Please create .env.local with:"
    echo "SUPABASE_URL=https://your-project.supabase.co"
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
fi

# Source environment variables
source .env.local

# Validate required variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}Error: Missing required environment variables${NC}"
    echo "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    exit 1
fi

FUNCTION_URL="$SUPABASE_URL/functions/v1/sync-official-videos"

echo -e "${YELLOW}Configuration:${NC}"
echo "Function URL: $FUNCTION_URL"
echo "Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."
echo ""

# Test 1: Basic connectivity
echo -e "${BLUE}Test 1: Basic Supabase connectivity${NC}"
if curl -I "$SUPABASE_URL" --max-time 10 --silent; then
    echo -e "${GREEN}✅ Basic connectivity: OK${NC}"
else
    echo -e "${RED}❌ Basic connectivity: FAILED${NC}"
    exit 1
fi

# Test 2: Edge Function endpoint availability
echo -e "${BLUE}Test 2: Edge Function endpoint${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$FUNCTION_URL" --max-time 10 || echo "000")
if [ "$response" = "200" ] || [ "$response" = "405" ]; then
    echo -e "${GREEN}✅ Edge Function endpoint: OK (HTTP $response)${NC}"
else
    echo -e "${YELLOW}⚠️  Edge Function endpoint: HTTP $response${NC}"
fi

# Test 3: Authentication test
echo -e "${BLUE}Test 3: Authentication test${NC}"
auth_response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$FUNCTION_URL" \
    -H "Authorization: Bearer invalid_key" \
    -H "Content-Type: application/json" \
    -d '{"test": true}' \
    --max-time 10 || echo "000")

if [ "$auth_response" = "401" ] || [ "$auth_response" = "403" ]; then
    echo -e "${GREEN}✅ Authentication: OK (properly rejecting invalid keys)${NC}"
else
    echo -e "${YELLOW}⚠️  Authentication test: HTTP $auth_response${NC}"
fi

# Test 4: Actual function call
echo -e "${BLUE}Test 4: Function execution (this may take a while...)${NC}"
echo "Calling function with 5-minute timeout..."

start_time=$(date +%s)
temp_file=$(mktemp)
error_file=$(mktemp)

http_code=$(curl -s -w "%{http_code}" \
    --max-time 300 \
    --connect-timeout 30 \
    -X POST "$FUNCTION_URL" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -H "User-Agent: Test-Script/1.0" \
    -d '{"trigger":"manual_test","source":"test_script","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' \
    -o "$temp_file" 2>"$error_file") || {
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        
        echo -e "${RED}❌ Function call failed after ${duration}s${NC}"
        echo -e "${YELLOW}Error details:${NC}"
        cat "$error_file" || echo "No error details available"
        echo -e "${YELLOW}Response (if any):${NC}"
        cat "$temp_file" || echo "No response content"
        
        # Cleanup
        rm -f "$temp_file" "$error_file"
        exit 1
    }

end_time=$(date +%s)
duration=$((end_time - start_time))

echo -e "${BLUE}Function call completed in ${duration}s${NC}"
echo -e "${BLUE}HTTP Status: $http_code${NC}"
echo -e "${YELLOW}Response:${NC}"
cat "$temp_file" | jq . 2>/dev/null || cat "$temp_file"

# Analyze results
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ SUCCESS: Function executed successfully!${NC}"
elif [ "$http_code" = "504" ]; then
    echo -e "${RED}❌ TIMEOUT: Function took too long to execute${NC}"
    echo -e "${YELLOW}Possible causes:${NC}"
    echo "- Function is processing too many videos"
    echo "- YouTube API rate limiting"
    echo "- Database performance issues"
    echo "- Network connectivity problems"
elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
    echo -e "${RED}❌ AUTHENTICATION: Invalid service role key${NC}"
elif [ "$http_code" = "500" ]; then
    echo -e "${RED}❌ SERVER ERROR: Check Supabase Edge Function logs${NC}"
else
    echo -e "${YELLOW}⚠️  Unexpected HTTP status: $http_code${NC}"
fi

# Cleanup
rm -f "$temp_file" "$error_file"

echo ""
echo -e "${BLUE}=== Test completed ===${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Check Supabase Edge Functions logs in your dashboard"
echo "2. Verify your GitHub secrets are correctly set"
echo "3. Consider optimizing the function if timeouts persist"
